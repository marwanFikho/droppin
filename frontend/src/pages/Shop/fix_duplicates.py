import re

# Read the file
with open('ShopPackages.js', 'r') as f:
    lines = f.readlines()

# Find the lines to remove
start_pattern = "                {selectedPackage?.deliveredItems && Array.isArray(selectedPackage.deliveredItems) && selectedPackage.deliveredItems.length > 0 && ("
end_pattern = "                )}"

# Find start and end indices
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if start_pattern in line:
        start_idx = i
    elif start_idx is not None and end_pattern in line and "})()" in line:
        end_idx = i
        break

if start_idx is not None and end_idx is not None:
    # Remove the duplicate section
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    
    # Write back to file
    with open('ShopPackages.js', 'w') as f:
        f.writelines(new_lines)
    
    print(f"Removed duplicate section from line {start_idx+1} to {end_idx+1}")
else:
    print("Could not find duplicate section to remove")
