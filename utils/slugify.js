exports.slugify = (str = '') =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')   // remove non‑alphanumerics
      .replace(/\s+/g, '-')       // spaces → hyphens
      .replace(/-+/g, '-');       // collapse multiple hyphens
  