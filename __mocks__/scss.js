module.exports = new Proxy(
  {},
  {
    get: (target, key) => {
      if (key === '__esModule') {
        return true;
      }
      return key;
    },
  }
);
