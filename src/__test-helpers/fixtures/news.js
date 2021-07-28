import { uuid } from '../../utils/string';

const mockNewsData = [{
  id: uuid(),
  title: 'howdy there',
  description: 'do you want to earn a shiny new golden EarthRanger badge? Inquire within!',
  link: 'https://earthranger.com/hello/wow',
  additional: {
    created_at: '2021-06-29T21:15:33.256Z',
  },
  read: false,
}, {
  id: uuid(),
  title: 'howdy doody',
  description: 'This message has already been read, but you are welcome to read it again pal',
  link: 'https://earthranger.com/about',
  additional: {
    created_at: '2021-07-04T00:04:22.000Z',
  },
  read: true,
}, {
  id: uuid(),
  title: '123 here we go',
  description: 'having a toddler means a life sentence of listening to "baby shark" until your eyes fall out, and that\'s ok',
  link: 'https://earthranger.com/yep/neat',
  additional: {
    created_at: '2021-07-02T01:01:01.111Z',
  },
  read: false,
}];

export default mockNewsData;