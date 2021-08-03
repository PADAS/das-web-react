const mockSubjectsData = [{
  'content_type': 'observations.subject',
  'id': '0f36c930-bb2e-416e-a943-ef610eb1e04e',
  'name': 'Jes Pixel',
  'subject_type': 'wildlife',
  'subject_subtype': 'dugong',
  'common_name': null,
  'additional': {
    'rgb': '',
    'sex': 'male',
    'region': '',
    'country': '',
    'tm_animal_id': ''
  },
  'created_at': '2020-08-13T14:17:45.198599-07:00',
  'updated_at': '2020-09-29T13:16:18.614136-07:00',
  'is_active': true,
  'region': '',
  'country': '',
  'sex': 'male',
  'tracks_available': true,
  'image_url': '/static/dugong-male.svg',
  'last_position_status': {
    'last_voice_call_start_at': null,
    'radio_state_at': '2020-10-04T11:24:42+00:00',
    'radio_state': 'roam app state'
  },
  'last_position_date': '2020-10-04T11:24:41+00:00',
  'last_position': {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [
        -122.38420717,
        47.52167737
      ]
    },
    'properties': {
      'title': 'Jes Pixel',
      'subject_type': 'wildlife',
      'subject_subtype': 'dugong',
      'id': '0f36c930-bb2e-416e-a943-ef610eb1e04e',
      'stroke': '',
      'stroke-opacity': 1,
      'stroke-width': 2,
      'image': 'https://develop.pamdas.org/static/dugong-male.svg',
      'last_voice_call_start_at': null,
      'location_requested_at': null,
      'radio_state_at': '2020-10-04T11:24:42+00:00',
      'radio_state': 'roam app state',
      'coordinateProperties': {
        'time': '2020-10-04T11:24:41+00:00'
      },
      'DateTime': '2020-10-04T11:24:41+00:00'
    }
  },
  'url': 'https://develop.pamdas.org/api/v1.0/subject/0f36c930-bb2e-416e-a943-ef610eb1e04e'
},
{
  'content_type': 'observations.subject',
  'id': '666420-bb2e-416e-a943-ef610eb1e04e',
  'name': 'Static ol\' Joshua',
  'subject_type': 'person',
  'subject_subtype': 'ranger',
  'common_name': null,
  'additional': {
    'rgb': '',
    'sex': 'male',
    'region': '',
    'country': '',
  },
  'created_at': '2020-08-13T14:17:45.198599-07:00',
  'updated_at': '2020-09-29T13:16:18.614136-07:00',
  'is_active': true,
  'region': '',
  'country': '',
  'sex': 'male',
  'tracks_available': false,
  'image_url': '/static/dugong-female.svg',
  'last_position_status': null,
  'last_position_date': null,
  'last_position': null,
  'static_position': [0, 1],
  'url': 'https://develop.pamdas.org/api/v1.0/subject/666420-bb2e-416e-a943-ef610eb1e04e'
},
];

export const mockMapSubjectFeatureCollection = {
  'type':'FeatureCollection',
  'features':[
    {'type':'Feature','properties':{'content_type':'observations.subject','id':'172df632-3fd4-4e5d-8366-925b92fcf025','name':'RD-001','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{},'created_at':'2021-02-16T01:04:26.664799-08:00','updated_at':'2021-02-16T01:04:26.664833-08:00','is_active':true,'tracks_available':true,'image_url':'/static/ranger-gray.svg','last_position_status':{'last_voice_call_start_at':'2021-02-16T09:03:55+00:00','radio_state_at':'2021-02-16T09:04:25+00:00','radio_state':'offline'},'last_position_date':'2021-01-27T09:04:25+00:00','device_status_properties': [{'label':'Favorite Color','units':'','value':'DarkBlue'},{'label':'Model No.','units':'','value':'Gidr1000'},{'label':'','units':'','value':'C'}],'url':'https://develop.pamdas.org/api/v1.0/subject/172df632-3fd4-4e5d-8366-925b92fcf025','title':'RD-001','stroke':'#FFFF00','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-gray.svg','last_voice_call_start_at':'2021-02-16T09:03:55+00:00','location_requested_at':null,'radio_state_at':'2021-02-16T09:04:25+00:00','radio_state':'offline','coordinateProperties':{'time':'2021-01-27T09:04:25+00:00'},'DateTime':'2021-01-27T09:04:25+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[37.37617,0.22316]}},
    {'type':'Feature','properties':{'content_type':'observations.subject','id':'199d69c2-795f-404c-9af5-7289d675cbd3','name':'Radio No. 1','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{'rgb':'110,158,172','sex':'male','region':'','country':'','tm_animal_id':''},'created_at':'2020-03-29T15:11:56.940453-07:00','updated_at':'2020-05-01T10:35:25.148108-07:00','is_active':true,'region':'','country':'','sex':'male','tracks_available':true,'image_url':'/static/ranger-blue.svg','last_position_status':{'last_voice_call_start_at':'2020-06-24T15:15:33+00:00','radio_state_at':'2020-06-24T15:20:54+00:00','radio_state':'online'},'last_position_date':'2020-11-12T17:21:05+00:00','device_status_properties':null,'url':'https://develop.pamdas.org/api/v1.0/subject/199d69c2-795f-404c-9af5-7289d675cbd3','title':'Radio No. 1','stroke':'#6E9EAC','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-blue.svg','last_voice_call_start_at':'2020-06-24T15:15:33+00:00','location_requested_at':null,'radio_state_at':'2020-06-24T15:20:54+00:00','radio_state':'online','coordinateProperties':{'time':'2020-11-12T17:21:05+00:00'},'DateTime':'2020-11-12T17:21:05+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[-3.319247817157387,37.38961074832439]}},{'type':'Feature','properties':{'content_type':'observations.subject','id':'2dbb8f8f-1d21-4373-bda5-899dd0343390','name':'CD 002','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{'rgb':'157,213,123'},'created_at':'2021-03-09T09:53:31.656926-08:00','updated_at':'2021-03-15T11:55:18.552110-07:00','is_active':true,'tracks_available':true,'image_url':'/static/ranger-black.svg','last_position_status':{'last_voice_call_start_at':null,'radio_state_at':null,'radio_state':'na'},'last_position_date':'2021-03-09T17:53:31+00:00','device_status_properties':[],'url':'https://develop.pamdas.org/api/v1.0/subject/2dbb8f8f-1d21-4373-bda5-899dd0343390','title':'CD 002','stroke':'#9DD57B','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-black.svg','last_voice_call_start_at':null,'location_requested_at':null,'radio_state_at':'1970-01-01T00:00:00+00:00','radio_state':'na','coordinateProperties':{'time':'2021-03-09T17:53:31+00:00'},'DateTime':'2021-03-09T17:53:31+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[37.4422,0.2162]}},{'type':'Feature','properties':{'content_type':'observations.subject','id':'3f0ddc20-45e8-4a6d-bd49-04a56c9ac395','name':'R-43G3','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{'rgb':'','sex':'male','region':'','country':'','tm_animal_id':''},'created_at':'2021-04-12T07:50:01.876633-07:00','updated_at':'2021-04-21T10:26:01.907497-07:00','is_active':true,'region':'','country':'','sex':'male','tracks_available':true,'image_url':'/static/ranger-gray.svg','last_position_status':{'last_voice_call_start_at':'2021-04-12T19:36:37+00:00','radio_state_at':'2021-04-12T19:37:07+00:00','radio_state':'offline'},'last_position_date':'2021-04-12T19:37:07+00:00','device_status_properties':[],'url':'https://develop.pamdas.org/api/v1.0/subject/3f0ddc20-45e8-4a6d-bd49-04a56c9ac395','title':'R-43G3','stroke':'','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-gray.svg','last_voice_call_start_at':'2021-04-12T19:36:37+00:00','location_requested_at':null,'radio_state_at':'2021-04-12T19:37:07+00:00','radio_state':'offline','coordinateProperties':{'time':'2021-04-12T19:37:07+00:00'},'DateTime':'2021-04-12T19:37:07+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[37.37273660015727,0.2223509721670045]}},{'type':'Feature','properties':{'content_type':'observations.subject','id':'4f08a4ee-1ff3-4e13-8c94-596a96851748','name':'Radio No. 4','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{'rgb':'117,119,102'},'created_at':'2020-03-29T15:15:07.867621-07:00','updated_at':'2020-05-01T10:35:25.154937-07:00','is_active':true,'tracks_available':true,'image_url':'/static/ranger-gray.svg','last_position_status':{'last_voice_call_start_at':'2020-06-24T15:18:50+00:00','radio_state_at':'2020-06-24T15:21:23+00:00','radio_state':'offline'},'last_position_date':'2020-06-24T15:19:20+00:00','device_status_properties':[],'url':'https://develop.pamdas.org/api/v1.0/subject/4f08a4ee-1ff3-4e13-8c94-596a96851748','title':'Radio No. 4','stroke':'#757766','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-gray.svg','last_voice_call_start_at':'2020-06-24T15:18:50+00:00','location_requested_at':null,'radio_state_at':'2020-06-24T15:21:23+00:00','radio_state':'offline','coordinateProperties':{'time':'2020-06-24T15:19:20+00:00'},'DateTime':'2020-06-24T15:19:20+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[38.50478786934799,-1.655387002748893]}},{'type':'Feature','properties':{'content_type':'observations.subject','id':'5e3e4970-c4fe-422f-b6e4-476019c965b9','name':'RD-002','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{},'created_at':'2021-02-16T01:20:55.040170-08:00','updated_at':'2021-02-16T01:20:55.040252-08:00','is_active':true,'tracks_available':true,'image_url':'/static/ranger-gray.svg','last_position_status':{'last_voice_call_start_at':'2018-12-09T09:21:03+00:00','radio_state_at':'2021-02-16T09:21:03+00:00','radio_state':'offline'},'last_position_date':'2018-12-09T09:21:03+00:00','device_status_properties':[],'url':'https://develop.pamdas.org/api/v1.0/subject/5e3e4970-c4fe-422f-b6e4-476019c965b9','title':'RD-002','stroke':'#FFFF00','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-gray.svg','last_voice_call_start_at':'2018-12-09T09:21:03+00:00','location_requested_at':null,'radio_state_at':'2021-02-16T09:21:03+00:00','radio_state':'offline','coordinateProperties':{'time':'2018-12-09T09:21:03+00:00'},'DateTime':'2018-12-09T09:21:03+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[37.37609395448646,0.2231180684015837]}},{'type':'Feature','properties':{'content_type':'observations.subject','id':'6276373b-3bb7-47a7-b29e-4855611a3ba9','name':'Radio No. 2','subject_type':'person','subject_subtype':'ranger','common_name':null,'additional':{'rgb':'183,149,100'},'created_at':'2020-03-29T15:14:17.483638-07:00','updated_at':'2020-05-01T10:35:25.150877-07:00','is_active':true,'tracks_available':true,'image_url':'/static/ranger-green.svg','last_position_status':{'last_voice_call_start_at':'2020-06-24T15:16:08+00:00','radio_state_at':'2020-06-24T15:19:07+00:00','radio_state':'online-gps'},'last_position_date':'2020-06-24T15:16:38+00:00','device_status_properties':[],'url':'https://develop.pamdas.org/api/v1.0/subject/6276373b-3bb7-47a7-b29e-4855611a3ba9','title':'Radio No. 2','stroke':'#B79564','stroke-opacity':1,'stroke-width':2,'image':'https://develop.pamdas.org/static/ranger-green.svg','last_voice_call_start_at':'2020-06-24T15:16:08+00:00','location_requested_at':null,'radio_state_at':'2020-06-24T15:19:07+00:00','radio_state':'online-gps','coordinateProperties':{'time':'2020-06-24T15:16:38+00:00'},'DateTime':'2020-06-24T15:16:38+00:00','ticker':''},'geometry':{'type':'Point','coordinates':[36.0307966468854,0.272991430436341]}}]
};

export default mockSubjectsData;
