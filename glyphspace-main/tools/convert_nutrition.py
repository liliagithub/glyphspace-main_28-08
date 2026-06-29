"""
Convert the OpenNutrition TSV dataset into GlyphSpace JSON format.

1. Reads the TSV (326k foods)
2. Filters to 'everyday' type (~5300)
3. Samples ~2000 items
4. Flattens nutrition_100g JSON fields into columns
5. Generates schema.json, feature.json, meta.json, position.pca.json, position.tsne.json
6. Updates default-dataset.ts
"""

import csv
import json
import math
import os
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import LabelEncoder

DATA_DIR = "./src/assets/data/"
DEFAULT_DATASET_FILE = "./src/default-dataset.ts"
TSV_PATH = r"C:\Users\User\Downloads\opennutrition-dataset-2025.1\opennutrition_foods.tsv"
SAMPLE_SIZE = 2000
ENUMERATE_THRESHOLD = 20


def is_enumerate(values):
    unique = set(v for v in values if v is not None and v != "")
    return len(unique) <= ENUMERATE_THRESHOLD


def current_timestamp():
    return datetime.now().strftime("%d%m%Y")


def flatten_tsv():
    """Read TSV, filter to everyday, sample, flatten nutrition_100g."""
    print(f"Reading TSV (this may take a moment)...")
    rows = []
    with open(TSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row.get("type") == "everyday":
                rows.append(row)

    print(f"  Everyday foods: {len(rows)}")

    # Sample
    if len(rows) > SAMPLE_SIZE:
        import random
        random.seed(42)
        rows = random.sample(rows, SAMPLE_SIZE)

    print(f"  Sampled: {len(rows)}")

    # Collect all nutrition keys from the first row
    sample_nutrition = json.loads(rows[0]["nutrition_100g"])
    nutrition_keys = sorted(sample_nutrition.keys())
    print(f"  Nutrition fields: {len(nutrition_keys)}")

    # Build flattened rows
    flat_rows = []
    for row in rows:
        flat = {"ID": row["id"], "name": row["name"]}
        nutrition = json.loads(row["nutrition_100g"])
        for key in nutrition_keys:
            val = nutrition.get(key)
            flat[f"nutrition_{key}"] = float(val) if val is not None else 0.0
        flat_rows.append(flat)

    print(f"  Flattened columns: {len(flat_rows[0])}")

    # Filter to keep only items with non-zero values for required attributes
    required = ["nutrition_calories", "nutrition_dietary_fiber", "nutrition_protein"]
    before = len(flat_rows)
    flat_rows = [row for row in flat_rows if all(row.get(r, 0) > 0 for r in required)]
    print(f"  After filtering (require calories, fiber, protein > 0): {len(flat_rows)} (removed {before - len(flat_rows)})")

    return flat_rows, nutrition_keys


def generate_schema(flat_rows, nutrition_keys, output_base):
    """Generate the schema.json file."""
    column_names = ["name"] + [f"nutrition_{k}" for k in nutrition_keys]
    column_indices = list(range(1, len(column_names) + 1))

    types = {}
    for i, col_name in zip(column_indices, column_names):
        vals = [row[col_name] for row in flat_rows if col_name in row]
        if col_name == "name":
            types[str(i)] = "text"
        else:
            types[str(i)] = "numeric"

    schema = {
        "color": "2",
        "glyph": ["63", "11", "77", "76", "22"],
        "label": {str(i): name for i, name in zip(column_indices, column_names)},
        "types": types,
        "tooltip": [str(i) for i in column_indices],
        "variantcontext": {
            "1": {
                "description": "standard context",
                "id": "1"
            }
        }
    }

    path = f"{output_base}.schema.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=4)
    print(f"  Schema: {path}")


def generate_features(flat_rows, nutrition_keys, output_base):
    """Generate the feature.json file with normalized values."""
    column_names = ["name"] + [f"nutrition_{k}" for k in nutrition_keys]

    # Build numeric matrix (skip name column)
    numeric_cols = column_names[1:]
    matrix = np.array([[row[col] for col in numeric_cols] for row in flat_rows], dtype=float)

    # Normalize each column: cube-root transform then divide by max
    # Cube root compresses large values and expands small ones,
    # so even low-value items have visible glyph axes.
    normalized = np.zeros_like(matrix)
    for j in range(matrix.shape[1]):
        col = matrix[:, j]
        cmax = col.max()
        if cmax > 1e-10:
            normalized[:, j] = np.cbrt(col / cmax)
        else:
            normalized[:, j] = 0.0

    features_list = []
    for i, row in enumerate(flat_rows):
        feature_dict = {'1': ''}  # name placeholder (schema index 1)
        value_dict = {'1': str(row['name'])}  # original name
        for j, col_name in enumerate(numeric_cols):
            idx_str = str(j + 2)  # schema index (name=1, first nutrition=2)
            feature_dict[idx_str] = float(normalized[i, j])
            value_dict[idx_str] = str(row[col_name])
        
        features_list.append({
            "defaultcontext": "1",
            "features": {
                "1": feature_dict
            },
            "id": row["ID"],
            "values": value_dict
        })

    path = f"{output_base}.feature.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(features_list, f, indent=2)
    print(f"  Features: {path}")

    # Return features_df-like structure for position generation
    # Columns: ID + numeric cols
    features_df_data = {"ID": [row["ID"] for row in flat_rows]}
    for j, col_name in enumerate(numeric_cols):
        features_df_data[col_name] = normalized[:, j].tolist()
    return features_df_data


def generate_meta(flat_rows, nutrition_keys, features_df_data, output_base):
    """Generate the meta.json file with statistics."""
    numeric_cols = [f"nutrition_{k}" for k in nutrition_keys]
    meta_features = {"1": {"histogram": {}, "categories": [], "max": 0, "min": 0, "median": 0, "variance": 0, "deviation": 0}}

    for j, col_name in enumerate(numeric_cols):
        vals = np.array([row[col_name] for row in flat_rows], dtype=float)
        idx_str = str(j + 2)  # schema index (name=1, first nutrition=2)

        col_min = float(vals.min())
        col_max = float(vals.max())
        col_median = float(np.median(vals))
        col_variance = float(np.var(vals))
        col_std = float(np.std(vals))

        # Histogram (20 bins)
        counts, _ = np.histogram(vals, bins=20, density=True)
        histogram = {str(k): float(c) for k, c in enumerate(counts)}

        meta_features[idx_str] = {
            "histogram": histogram,
            "categories": [],
            "max": col_max,
            "min": col_min,
            "median": col_median,
            "variance": col_variance,
            "deviation": col_std
        }

    meta = {"features": meta_features}
    path = f"{output_base}.meta.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=4)
    print(f"  Meta: {path}")


def generate_pca_positions(features_df_data, output_base, columns=None):
    """Generate PCA projection positions. If columns is provided, use only those."""
    numeric_cols = columns if columns else [c for c in features_df_data if c != "ID"]
    matrix = np.array([features_df_data[c] for c in numeric_cols], dtype=float).T
    
    pca = PCA(n_components=2)
    result = pca.fit_transform(matrix)

    positions = []
    for i, id_val in enumerate(features_df_data["ID"]):
        positions.append({
            "id": id_val,
            "position": {"x": float(result[i, 0]), "y": float(result[i, 1])}
        })

    path = f"{output_base}.position.pca.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(positions, f, indent=4)
    print(f"  PCA positions: {path}")


def generate_tsne_positions(features_df_data, output_base, columns=None):
    """Generate t-SNE projection positions. If columns is provided, use only those."""
    numeric_cols = columns if columns else [c for c in features_df_data if c != "ID"]
    matrix = np.array([features_df_data[c] for c in numeric_cols], dtype=float).T
    
    tsne = TSNE(n_components=2, random_state=42, init="random", perplexity=30)
    result = tsne.fit_transform(matrix)

    positions = []
    for i, id_val in enumerate(features_df_data["ID"]):
        positions.append({
            "id": id_val,
            "position": {"x": float(result[i, 0]), "y": float(result[i, 1])}
        })

    path = f"{output_base}.position.tsne.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(positions, f, indent=4)
    print(f"  t-SNE positions: {path}")


def discover_datasets():
    """Scan data dir and rebuild default-dataset.ts (same as process.py)."""
    pattern = re.compile(
        r"^(?P<base>.+?)\.(?P<time>\d{8})\.(?P<type>\w+)(?:\.(?P<subtype>\w+))?\.json$"
    )
    grouped = defaultdict(lambda: defaultdict(dict))

    for file in os.listdir(DATA_DIR):
        if not file.endswith(".json"):
            continue
        match = pattern.match(file)
        if not match:
            continue
        base = match.group("base")
        time = match.group("time")
        ftype = match.group("type")
        subtype = match.group("subtype")
        if subtype:
            grouped[base][time].setdefault(ftype, {})[subtype] = file
        else:
            grouped[base][time][ftype] = file

    result = []
    for base, time_map in grouped.items():
        items = []
        for time, algos in sorted(time_map.items()):
            items.append({"algorithms": algos, "time": time})
        result.append({"dataset": base, "source": "local", "items": items})

    with open(DEFAULT_DATASET_FILE, "w", encoding="utf-8") as f:
        f.write('import { DatasetCollection } from "./app/shared/interfaces/dataset-collection";\n\n')
        f.write("export const DEFAULT_DATASETCOLLECTION: DatasetCollection = ")
        json.dump(result, f, indent=4)
        f.write("\n")

    print(f"\n  default-dataset.ts updated with {len(result)} dataset(s)")


def main():
    print("=== OpenNutrition -> GlyphSpace Converter ===\n")

    # 1. Flatten the TSV
    flat_rows, nutrition_keys = flatten_tsv()

    # 2. Prepare output base
    timestamp = current_timestamp()
    base_name = "opennutrition"
    output_base = os.path.join(DATA_DIR, f"{base_name}.{timestamp}")

    # 3. Generate files (full 90-feature version)
    print("\nGenerating files (full 90-feature projection)...")
    generate_schema(flat_rows, nutrition_keys, output_base)
    features_df_data = generate_features(flat_rows, nutrition_keys, output_base)
    generate_meta(flat_rows, nutrition_keys, features_df_data, output_base)
    generate_pca_positions(features_df_data, output_base)
    generate_tsne_positions(features_df_data, output_base)

    # 4. Generate 5-attribute version (projection from only the 5 displayed glyph attributes)
    print("\nGenerating 5-attribute projection files...")
    glyph_nutrition_keys = ["calories", "dietary_fiber", "protein", "total_fat", "total_sugars"]
    glyph_col_names = [f"nutrition_{k}" for k in glyph_nutrition_keys]
    output_base_5attr = os.path.join(DATA_DIR, f"{base_name}_5attr.{timestamp}")
    # Copy schema, feature, meta from the full version
    for ext in ["schema", "feature", "meta"]:
        src = f"{output_base}.{ext}.json"
        dst = f"{output_base_5attr}.{ext}.json"
        with open(src, "r") as sf:
            with open(dst, "w") as df:
                df.write(sf.read())
        print(f"  Copied: {dst}")
    generate_pca_positions(features_df_data, output_base_5attr, glyph_col_names)
    generate_tsne_positions(features_df_data, output_base_5attr, glyph_col_names)

    # 5. Update default-dataset.ts (SKIP - custom default-dataset.ts with tsne first)
    # print("\nUpdating default dataset configuration...")
    # discover_datasets()

    print("\nDone! The opennutrition dataset is now ready.")
    print(f"  Items: {len(flat_rows)}")
    print(f"  Nutrition features: {len(nutrition_keys)}")
    print(f"  Glyph-only features: {len(glyph_nutrition_keys)}")


if __name__ == "__main__":
    main()
