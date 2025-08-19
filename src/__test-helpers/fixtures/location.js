export const epsg2154 = {
  area: 'France - onshore and offshore, mainland and Corsica (France métropolitaine including Corsica).',
  bbox: [ -9.86, 41.15, 10.38, 51.56 ],
  code: '2154',
  name: 'RGF93 v1 / Lambert-93',
  proj4: '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
};

export const epsg2946 = {
  area: 'Canada - Quebec and Labrador between 63°W and 60°W.',
  bbox: [ -63, 47.16, -60, 58.92 ],
  code: '2946',
  name: 'NAD83(CSRS) / MTM zone 4',
  proj4: '+proj=tmerc +lat_0=0 +lon_0=-61.5 +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +towgs84=-0.991,1.9072,0.5129,-1.25033e-07,-4.6785e-08,-5.6529e-08,0 +units=m +no_defs +type=crs'
};

export const epsg3857 = {
  area: 'World between 85.06°S and 85.06°N.',
  bbox: [ -180, -85.06, 180, 85.06 ],
  code: '3857',
  name: 'WGS 84 / Pseudo-Mercator',
  proj4: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs'
};

export const epsg4269 = {
  area: 'North America - onshore and offshore: Canada - Alberta; British Columbia; Manitoba; New Brunswick; Newfoundland and Labrador; Northwest Territories; Nova Scotia; Nunavut; Ontario; Prince Edward Island; Quebec; Saskatchewan; Yukon. Puerto Rico. United States (USA) - Alabama; Alaska; Arizona; Arkansas; California; Colorado; Connecticut; Delaware; Florida; Georgia; Hawaii; Idaho; Illinois; Indiana; Iowa; Kansas; Kentucky; Louisiana; Maine; Maryland; Massachusetts; Michigan; Minnesota; Mississippi; Missouri; Montana; Nebraska; Nevada; New Hampshire; New Jersey; New Mexico; New York; North Carolina; North Dakota; Ohio; Oklahoma; Oregon; Pennsylvania; Rhode Island; South Carolina; South Dakota; Tennessee; Texas; Utah; Vermont; Virginia; Washington; West Virginia; Wisconsin; Wyoming. US Virgin Islands. British Virgin Islands.',
  bbox: [ 167.65, 14.92, 319.27, 86.45 ],
  code: '4269',
  name: 'NAD83',
  proj4: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +type=crs'
};

export const epsg5367 = {
  area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
  bbox: [ -86.5, 2.21, -81.43, 11.77 ],
  code: '5367',
  name: 'CR05 / CRTM05',
  proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs'
};

export const epsg32633 = {
  area: 'Between 12°E and 18°E, northern hemisphere between equator and 84°N, onshore and offshore. Austria. Bosnia and Herzegovina. Cameroon. Central African Republic. Chad. Congo. Croatia. Czechia. Democratic Republic of the Congo (Zaire). Gabon. Germany. Hungary. Italy. Libya. Malta. Niger. Nigeria. Norway. Poland. San Marino. Slovakia. Slovenia. Svalbard. Sweden. Vatican City State.',
  bbox: [ 12, 0, 18, 84 ],
  code: '32633',
  name: 'WGS 84 / UTM zone 33N',
  proj4: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs'
};

export const epsg32719 = {
  area: 'Between 72°W and 66°W, southern hemisphere between 80°S and equator, onshore and offshore. Argentina. Bolivia. Brazil. Chile. Colombia. Peru.',
  bbox: [ -72, -80, -66, 0 ],
  code: '32719',
  name: 'WGS 84 / UTM zone 19S',
  proj4: '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs +type=crs'
};
