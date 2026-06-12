import sys

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add state
state_injection = """
  const [localUserDocument, setLocalUserDocument] = useState(userDocument);
  useEffect(() => setLocalUserDocument(userDocument), [userDocument]);
  
  const [localRutUrl, setLocalRutUrl] = useState(rutUrl);
  useEffect(() => setLocalRutUrl(rutUrl), [rutUrl]);
  
  const [localCertUrl, setLocalCertUrl] = useState(certUrl);
  useEffect(() => setLocalCertUrl(certUrl), [certUrl]);
"""

content = content.replace(
    """  const [localUserDocument, setLocalUserDocument] = useState(userDocument);
  useEffect(() => setLocalUserDocument(userDocument), [userDocument]);""",
    state_injection.strip()
)

# Update handleUpdateDocument
update_injection = """
      const userRef = doc(db, 'users', userUid);
      const updateData: any = {};
      if (type === 'rut') {
        updateData.rutUrl = downloadUrl;
        setLocalRutUrl(downloadUrl);
      }
      if (type === 'cert') {
        updateData.certUrl = downloadUrl;
        setLocalCertUrl(downloadUrl);
      }
"""

content = content.replace(
    """
      const userRef = doc(db, 'users', userUid);
      const updateData: any = {};
      if (type === 'rut') updateData.rutUrl = downloadUrl;
      if (type === 'cert') updateData.certUrl = downloadUrl;
""".strip(),
    update_injection.strip()
)

# Update UI links
content = content.replace(
    '<a href={rutUrl || \'#\'}',
    '<a href={localRutUrl || \'#\'}'
)

content = content.replace(
    '<a href={certUrl || \'#\'}',
    '<a href={localCertUrl || \'#\'}'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch URLs successful!")
