export const userWithPin = {
  'username': 'jm_eulatest',
  'email': null,
  'first_name': 'jm',
  'last_name': 'eula test',
  'role': '',
  'is_staff': true,
  'is_superuser': false,
  'date_joined': '2020-09-10T10:33:48.891060-07:00',
  'id': '87c73d59-67b5-459a-8111-05ff03f970f4',
  'is_active': true,
  'last_login': '2020-09-10T10:34:02.290202-07:00',
  'accepted_eula': true,
  'pin': '6666'
};

export const userWithoutPin = {
  'username': 'jk_whatever',
  'email': 'jk@bidness.helasdfasdx',
  'first_name': 'joshua',
  'last_name': 'the fool',
  'role': 'king of weird fixture definitions',
  'is_staff': false,
  'is_superuser': true,
  'date_joined': '1998-09-10T10:33:48.891060-07:00',
  'id': '87cda39-67b5-5j8d-8111-05dh03f974fa',
  'is_active': true,
  'last_login': '2001-09-10T10:34:02.290202-07:00',
  'accepted_eula': true,
  'pin': null
};

export const userWithoutEula = {
  'username': 'oopsie_daisy',
  'email': null,
  'first_name': null,
  'last_name': null,
  'role': 'me_now',
  'is_staff': false,
  'is_superuser': false,
  'date_joined': '1998-09-10T10:33:48.891060-07:00',
  'id': '87cdd39-67b5-5j8d-8171-05dh03f974fa',
  'is_active': true,
  'last_login': '2001-09-10T10:34:02.290202-07:00',
  'accepted_eula': false,
  'pin': '1234',
};

export const userList = [
  userWithPin,
  userWithoutPin,
  userWithoutEula,
];