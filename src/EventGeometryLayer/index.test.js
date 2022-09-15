// describe('EventGeometryLayer', () => {
//   describe('the source data', () => {
//     test('adding the source to the map', () => {
//       render(<EventGeometryLayer events={events} />);

//       expect(map.addSource).toHaveBeenCalledWith(GEOMETRY_SOURCE_ID);
//     });

//     test('only adding events with a `geometry` property', () => {


//       render(<EventGeometryLayer events={events} />);

//       const source = map.getSource(GEOMETRY_SOURCE_ID);

//       expect(source.setData).toHaveBeenCalledWith(filteredSourceData);
//     });
//   });

//   describe('the layer', () => {
//     test('adding the layer to the map', () => {
//       render(<EventGeometryLayer events={events} />);

//       expect(map.addLayer).toHaveBeenCalledWith(GEOMETRY_LAYER_ID);
//     });

//     test('setting feature color based on priority', () => {
//       expect(featureData[0].properties.color).toEqual(PRIORITY_COLOR_MAP[featureData[0].properties.priority]);
//     });
//   });
// });