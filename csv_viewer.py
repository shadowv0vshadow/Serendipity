import pandas as pd

def csv_to_md(csv_file, md_file, limit=100):
    try:
        df = pd.read_csv(csv_file)
        # Select relevant columns to keep it readable
        cols = ['Rank', 'Artist', 'Album', 'Rating', 'Ratings Count', 'Date']
        if set(cols).issubset(df.columns):
            df = df[cols]
        
        markdown_table = df.head(limit).to_markdown(index=False)
        
        with open(md_file, 'w') as f:
            f.write(f"# Top {limit} Albums (All-Time)\n\n")
            f.write(markdown_table)
        print(f"Successfully converted {csv_file} to {md_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    csv_to_md("rym_chart_all_time.csv", "results_view.md")
