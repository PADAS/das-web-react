const eventCategories = {
  sprinttesting: {
    id: '3c7f5dc3-dc33-4e7e-9de4-33b97b5fab03',
    value: 'sprinttesting',
    display: 'Sprint Testing',
    is_active: true,
    ordernum: -4,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  monitoring: {
    id: 'e31f75e3-d86d-4e20-b397-5bb9fe46c5cf',
    value: 'monitoring',
    display: 'Monitoring',
    is_active: true,
    ordernum: 1,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  analyzer_event: {
    id: 'ef230385-5afc-40d1-ad07-c811f6da2b3c',
    value: 'analyzer_event',
    display: 'Analyzer Event',
    is_active: true,
    ordernum: 1,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  security: {
    id: '007a45d3-2aba-4ed1-b3fc-e09fc0ad41f8',
    value: 'security',
    display: 'Security',
    is_active: true,
    ordernum: 58,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  logistics: {
    id: '2f7ecd77-43db-4687-adba-58fcd42fac14',
    value: 'logistics',
    display: 'Logistics',
    is_active: true,
    ordernum: 30,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_security: {
    id: 'daf3fac6-8573-474e-90e1-182c91fff9e7',
    value: 'sand_security',
    display: 'Sand-Security',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_easterisland_security: {
    id: 'f71ffeeb-2a69-438b-bfb1-ef8b3bbe85a1',
    value: 'sand_easterisland_security',
    display: 'Sand-Easter Island-Security',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_monitoring: {
    id: '2bf090f0-8490-4b4f-9f22-775519cf1fa2',
    value: 'sand_monitoring',
    display: 'Sand-Monitoring',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_logistics: {
    id: '5d051dc8-fedf-48ce-a36b-ea42c5341660',
    value: 'sand_logistics',
    display: 'Sand-Logistics',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_easterisland_monitoring: {
    id: 'd7b24937-1e52-4873-a55e-eb4c4543f5fc',
    value: 'sand_easterisland_monitoring',
    display: 'Sand-Easter Island-Monitoring',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_easterisland_logistics: {
    id: '57de9812-4358-4dcf-b779-cead3a17b374',
    value: 'sand_easterisland_logistics',
    display: 'Sand-Easter Island-Logistics',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  hidden: {
    id: '50acb72c-5038-4f7f-9cb6-d432026f5032',
    value: 'hidden',
    display: 'HIDDEN',
    is_active: true,
    ordernum: null,
    flag: 'system',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_analyzer_event: {
    id: '8af6f1f3-6254-48ff-bc08-8d6b8a31b9dd',
    value: 'sand_analyzer_event',
    display: 'Sand-Analyzer Event',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  sand_easterisland_analyzer_event: {
    id: 'eefd9752-478b-46c1-8475-08d665f03415',
    value: 'sand_easterisland_analyzer_event',
    display: 'Sand-Easter Island-Analyzer Event',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  },
  smartconnect: {
    id: 'a0ed1066-c831-49ba-bfa3-bcd499713cfd',
    value: 'smartconnect',
    display: 'SMART Connect',
    is_active: true,
    ordernum: null,
    flag: 'user',
    permissions: [ 'create', 'update', 'read', 'delete' ]
  }
};

export const monitoringCategory = {
  id: 'e31f75e3-d86d-4e20-b397-5bb9fe46c5cf',
  value: 'monitoring',
  display: 'Monitoring',
  is_active: true,
  ordernum: 1,
  flag: 'user',
  permissions: [ 'create', 'update', 'read', 'delete' ]
};

export const securityCategory = {
  id: '007a45d3-2aba-4ed1-b3fc-e09fc0ad41f8',
  value: 'security',
  display: 'Security',
  is_active: true,
  ordernum: 58,
  flag: 'user',
  permissions: [ 'create', 'update', 'read', 'delete' ]
};

export default eventCategories;
