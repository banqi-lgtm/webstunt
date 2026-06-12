import sys

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add debugging to handleUpdateDocument
debug_injection = """
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log("Raw AI Response:", data);
      toast({ title: "Debug IA", description: JSON.stringify(data).substring(0, 200) });
"""

content = content.replace(
    """
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
""".strip(),
    debug_injection.strip()
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch Debug successful!")
