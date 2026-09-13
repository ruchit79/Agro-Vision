const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  // Normalize path with forward slashes and leading slash
  let relativePath = req.file.path.replace(/\\/g, "/");
  if (!relativePath.startsWith("/")) {
    relativePath = "/" + relativePath;
  }

  res.status(200).json({
    message: "Image uploaded successfully",
    filePath: relativePath
  });
};

export default uploadImage;

