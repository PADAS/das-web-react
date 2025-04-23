module.exports = new Proxy(
  {},
  {
    get: (_target, key) => {
      if (key === '__esModule') {
        return true;
      }
      return key;
    },
  }
);
