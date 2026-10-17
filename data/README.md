# Data Directory

Place the Metro Interstate Traffic Volume dataset CSV here.

## Download Instructions

1. Go to: https://www.kaggle.com/datasets/ramyahr/metro-interstate-traffic-volume
2. Download the dataset (you may need a free Kaggle account).
3. Extract the ZIP file.
4. Rename the CSV to: `Metro_Interstate_Traffic_Volume.csv`
5. Place it in this directory:

```
smart-traffic-prediction/
└── data/
    └── Metro_Interstate_Traffic_Volume.csv   ← here
```

## Expected Columns

| Column               | Type    | Description                          |
|----------------------|---------|--------------------------------------|
| holiday              | string  | US national holiday name or "None"   |
| temp                 | float   | Temperature in Kelvin                |
| rain_1h              | float   | Rainfall (mm) in last hour           |
| snow_1h              | float   | Snowfall (mm) in last hour           |
| clouds_all           | int     | Cloud cover percentage (0–100)       |
| weather_main         | string  | High-level weather category          |
| weather_description  | string  | Detailed weather description         |
| date_time            | string  | Timestamp (e.g. 2012-10-02 09:00:00) |
| traffic_volume       | int     | Hourly vehicle count (target)        |

## Dataset Information

- **Source**: Metro Interstate Traffic Volume (I-94 ATR 301, Minnesota)
- **Period**: ~2012–2018
- **Geographic scope**: A single section of Interstate 94 near Minneapolis/St. Paul, MN
- **License**: Check the Kaggle dataset page for license details

> ⚠️ Predictions from models trained on this dataset apply ONLY to this specific
> road segment. Do not generalize to other locations without retraining on local data.
