const proxy = new Proxy(
  {},
  {
    get: (_target, key) => {
      switch (key) {
        case '__esModule':
          return true;
        case 'default':
          return proxy;
        default:
          return key;
      }
    },
  },
);

module.exports = proxy;
