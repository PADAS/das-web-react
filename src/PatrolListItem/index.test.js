test('rendering without crashing', () => {

});

describe('the patrol list item', () => {
  test('showing an icon for the patrol type', () => {

  });

  test('showing the patrol title', () => {

  });

  test('showing a kebab menu for additional actions', () => {

  });

  describe('for active patrols', () => {
    test('showing a location jump button if the patrol has location data', () => {

    });

    test('showing a track button if the patrol has track data', () => {

    });

    test('canceling the patrol from the kebab menu', () => {

    });

    test('ending a patrol from the kebab menu', () => {

    });

  });

  describe('for scheduled patrols', () => {
    test('showing a "start" button which starts the patrol', () => {

    });

    test('canceling the patrol from the kebab menu', () => {

    });

  });

  describe('for overdue patrols', () => {
    test('showing an overdue indicator', () => {

    });
  });

  describe('for cancelled patrols', () => {
    test('showing a button to restore the patrol', () => {

    });
  });

  describe('for completed patrols', () => {
    // what goes here?
  });

  describe('using color to indicate state', () => {
    test('blue backgrounds for active patrols', () => {

    });

    test('green backgrounds for scheduled patrols', () => {

    });

    test('gray backgrounds for completed patrols', () => {

    });

    test('light gray backgrounds for cancelled patrols', () => {

    });

    test('red backgrounds for overdue patrols', () => {

    });

  });
});

