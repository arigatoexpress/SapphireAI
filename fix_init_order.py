
import os

file_path = "/Users/aribs/AIAster/cloud_trader/trading_service.py"

with open(file_path, "r") as f:
    lines = f.readlines()

# 1-based line numbers to 0-based indices
start_line = 181
end_line = 287 # Adjusted to exclude the empty line 288
insert_line = 165

# Extract the block
# Slice should be [180 : 287].
block = lines[start_line-1 : end_line]

# Verify the block content (sanity check)
print(f"Moving {len(block)} lines.")
print(f"First line: {block[0].strip()}")
print(f"Last line: {block[-1].strip()}")

if "Agents" not in block[0] or "Minimal TradingService initialized successfully" not in block[-1]:
    print("❌ Error: Block content does not match expected markers. Aborting.")
    exit(1)

# Remove the block
# We need to be careful about indices shifting.
# It's easier to build a new list.

new_lines = lines[:insert_line-1] + block + lines[insert_line-1:start_line-1] + lines[end_line:]

# Write back
with open(file_path, "w") as f:
    f.writelines(new_lines)

print("✅ Successfully moved initialization block.")
