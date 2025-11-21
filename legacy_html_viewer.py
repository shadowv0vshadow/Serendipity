import pandas as pd

def generate_html(csv_file, html_file):
    try:
        df = pd.read_csv(csv_file)
        
        # Create HTML with DataTables for interactivity
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>RYM Chart Data</title>
            <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.css">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                h1 {{ color: #333; text-align: center; }}
                table {{ width: 100%; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>RateYourMusic Chart Data</h1>
                {df.to_html(index=False, table_id="rymTable", classes="display")}
            </div>
            
            <script type="text/javascript" charset="utf8" src="https://code.jquery.com/jquery-3.7.0.js"></script>
            <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.js"></script>
            <script>
                $(document).ready( function () {{
                    $('#rymTable').DataTable({{
                        "pageLength": 50,
                        "order": [[ 0, "asc" ]]
                    }});
                }});
            </script>
        </body>
        </html>
        """
        
        with open(html_file, 'w') as f:
            f.write(html_content)
        print(f"Successfully generated {html_file}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_html("rym_chart_all_time.csv", "rym_chart_view.html")
