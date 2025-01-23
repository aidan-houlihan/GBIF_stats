import requests
import json
import tkinter as tk
from tkinter import messagebox, scrolledtext, filedialog

def get_download_statistics(start_date, end_date, datasetUUID):
    url = f"https://api.gbif.org/v1/occurrence/download/statistics?fromDate={start_date}&toDate={end_date}&datasetKey={datasetUUID}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data['results']
    else:
        return f"Error: {response.status_code}"

def view_statistics():
    start_date = start_date_entry.get()
    end_date = end_date_entry.get()
    selected_datasets = [dataset for dataset, var in dataset_vars.items() if var.get()]

    if not start_date or not end_date:
        messagebox.showerror("Input Error", "Please enter both start and end dates.")
        return

    all_statistics.clear()
    for dataset_name in selected_datasets:
        if dataset_name == 'Entomology':
            dataset_uuids = ['20524cf7-66f8-49d2-a274-102e1090e502', '0475db1b-e6f9-4418-9248-845e64047da8']
        else:
            dataset_uuids = [datasetUUIs[dataset_name]]
        
        dataset_stats = []
        for dataset_uuid in dataset_uuids:
            statistics = get_download_statistics(start_date, end_date, dataset_uuid)
            if isinstance(statistics, list):
                for stats in statistics:
                    stats['dataset_name'] = dataset_name
                    dataset_stats.append(stats)
        
        if not dataset_stats:
            dataset_stats.append({'dataset_name': dataset_name, 'year': 'N/A', 'month': 'N/A', 'totalRecords': 0, 'numberDownloads': 0})
        
        all_statistics.extend(dataset_stats)

    combined_entomology_stats = {}
    for stats in all_statistics:
        if stats['dataset_name'] == 'Entomology':
            month_year = (stats['month'], stats['year'])
            if month_year not in combined_entomology_stats:
                combined_entomology_stats[month_year] = {
                    'dataset_name': 'Entomology',
                    'month': stats['month'],
                    'year': stats['year'],
                    'totalRecords': 0,
                    'numberDownloads': 0
                }
            combined_entomology_stats[month_year]['totalRecords'] += stats['totalRecords']
            combined_entomology_stats[month_year]['numberDownloads'] += stats['numberDownloads']

    all_statistics[:] = [stats for stats in all_statistics if stats['dataset_name'] != 'Entomology']
    all_statistics.extend(combined_entomology_stats.values())

    output_text.delete(1.0, tk.END)  # Clear the text box
    for dataset_name in selected_datasets:
        output_text.insert(tk.END, f"Dataset: {dataset_name}\n")
        output_text.insert(tk.END, f"{'Year':<10}{'Month':<10}{'Total Records':<20}{'Number of Downloads':<20}\n")
        for stats in all_statistics:
            if stats['dataset_name'] == dataset_name:
                output_text.insert(tk.END, f"{stats['year']:<10}{stats['month']:<10}{stats['totalRecords']:<20}{stats['numberDownloads']:<20}\n")
        output_text.insert(tk.END, "\n")

def save_statistics():
    file_path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text files", "*.txt")])
    if not file_path:
        return

    with open(file_path, mode='w') as file:
        for dataset_name in dataset_vars.keys():
            file.write(f"Dataset: {dataset_name}\n")
            file.write(f"{'Year':<10}{'Month':<10}{'Total Records':<20}{'Number of Downloads':<20}\n")
            for stats in all_statistics:
                if stats['dataset_name'] == dataset_name:
                    file.write(f"{stats['year']:<10}{stats['month']:<10}{stats['totalRecords']:<20}{stats['numberDownloads']:<20}\n")
            file.write("\n")

    messagebox.showinfo("Success", f"Combined statistics have been written to {file_path}.")

def select_all_datasets():
    select_all = select_all_var.get()
    for var in dataset_vars.values():
        var.set(select_all)

# GUI setup
root = tk.Tk()
root.title("Download Statistics")

tk.Label(root, text="Start Date (YYYY-MM):").grid(row=0, column=0, padx=10, pady=5)
start_date_entry = tk.Entry(root)
start_date_entry.grid(row=0, column=1, padx=10, pady=5)

tk.Label(root, text="End Date (YYYY-MM):").grid(row=1, column=0, padx=10, pady=5)
end_date_entry = tk.Entry(root)
end_date_entry.grid(row=1, column=1, padx=10, pady=5)

select_all_var = tk.BooleanVar()
tk.Checkbutton(root, text="Select All", variable=select_all_var, command=select_all_datasets).grid(row=2, column=0, columnspan=2, sticky='w', padx=10, pady=2)

datasetUUIs = {
    'Entomology': '20524cf7-66f8-49d2-a274-102e1090e502',
    'Herbarium': 'f873ef66-231a-4ea3-bd4d-a16f182bf337',
    'Bryophytes': '039c9aba-2f77-4001-a72a-40b9fa830ab4',
    'Algae': '63e79196-626f-41a5-9871-0c29135ccd09',
    'Lichens': '38bdc3d6-9748-4f72-9d5f-55ffd573b5d1',
    'Mycology': 'd01d75ac-09d3-464f-8b0f-0a4ddecd6c10',
    'Malacology': '86b50d88-f762-11e1-a439-00145eb45e9a',
    'Ornithology': '8658262c-f762-11e1-a439-00145eb45e9a',
    'Ichthyology': 'de22e531-395a-468b-8830-bd1a8ad04673',
    'Herpetology': '86594bf6-f762-11e1-a439-00145eb45e9a',
    'VertPaelo': 'eaa45b10-2445-427b-b03c-a1e97b2c7087',
    'InvertPaelo': 'ec3805da-46a8-433b-bebc-20fed11f9e1e',
    'ANSP_Publisher': 'f9b67ad0-9c9b-11d9-b9db-b8a03c50a862'
}

dataset_vars = {}
row = 3
for dataset_name in datasetUUIs.keys():
    var = tk.BooleanVar()
    tk.Checkbutton(root, text=dataset_name, variable=var).grid(row=row, column=0, columnspan=2, sticky='w', padx=10, pady=2)
    dataset_vars[dataset_name] = var
    row += 1

tk.Button(root, text="View Statistics", command=view_statistics).grid(row=row, column=0, columnspan=2, pady=10)
tk.Button(root, text="Save Statistics", command=save_statistics).grid(row=row+1, column=0, columnspan=2, pady=10)

output_text = scrolledtext.ScrolledText(root, width=80, height=20)
output_text.grid(row=row+2, column=0, columnspan=2, padx=10, pady=10)

all_statistics = []

root.mainloop()