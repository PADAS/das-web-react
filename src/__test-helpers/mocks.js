export const createMapMock = (override = {}) => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  addLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  setLayerZoomRange: jest.fn(),
  getLayer: jest.fn(),
  addImage: jest.fn(),
  loadImage: jest.fn(),
  removeImage: jest.fn(),
  hasImage: jest.fn(),
  getSource: jest.fn().mockReturnValue({ setData: jest.fn() }),
  project: jest.fn(),
  ...override
});