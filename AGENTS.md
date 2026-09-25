# AGENTS.md

## Maintaining This File

This is the repository's only context file, and every agent loads all of it. Keep it true, readable, and lean, in that order.

- **When to edit.** When a change makes something here wrong, or adds a fact that every agent working here needs. Most changes need neither.
- **What belongs.** The domain and the reasons behind it: what each concept is, who relies on it, and how it is meant to behave. Beyond that, the architecture and conventions no single file reveals. Name a file, component or symbol only when it is a stable landmark an agent would otherwise have to hunt for. Never line numbers, prop or option lists, ticket numbers, a changelog, or anything the code or a lint rule already states.
- **When this file and the code disagree.** For a fact about the product or the architecture, the code wins: correct the file. For a convention, this file wins: older code that departs from it is not a reason to rewrite it.
- **Conventions belong to the team.** Add or change one only when the user sets it, never because a file, or your own diff, happens to do something a certain way.
- **How to write.** High level, clear, concise, and when saving tokens would cost clarity, keep the words. Each fact lives once, in its section: Product for the domain and its UI, Architecture for how the app is built, Conventions for how code is written, Workflow for how work is run and checked. Prefer rewriting an existing line over adding one, and delete whatever stopped being true.

## Product

This repository is the **EarthRanger web client**, used by control-room operators, protected-area managers and conservation staff at sites worldwide.

### Core Concepts

- **EarthRanger:** Real-time operational platform for protected areas. It brings sensor telemetry, field reports and partner data together on one map, so teams can see what is happening and respond.
- **DAS (Domain Awareness System):** EarthRanger's legacy name, still in the repository name and some API references.
- **Site (tenant):** One conservation area or organization at its own domain. The client is served from that domain and talks only to its backend, so everything it shows belongs to one site.
- **EarthRanger Mobile:** The rangers' iOS/Android app for filing events, running patrols and tracking themselves. Much of what this client shows was created there.
- **Admin:** Site configuration lives in the server's admin pages. The client reads it and never defines it.
- **Companion products:** **Ecoscope**, the advanced analytics layer, and **Gundi**, the middleware that connects external data sources to EarthRanger.

### Events

**Events** record something that happened at a place and time: a snare found, a carcass, an arrest, a fence break, a geofence breach. Rangers file them from the field, sensors and integrations file them automatically, and the control room triages and resolves them here.

An event has a serial number users quote, a **title** (shown as its event type's name when it has none, and with that name beneath it when it does), a **state**, a **priority**, a **reporter** (a user, or a subject such as a ranger's radio), a time, notes, files, and `event_details`, the values captured by its type's form.

**State** is the triage lifecycle: active until someone resolves it, with `review` for community submissions awaiting moderation. The client treats `new` as active too. **Priority** is `300` high / `200` medium / `100` low / `0` none.

> The codebase historically called events "reports", and many components, props and translation namespaces still do. "Event" is the preferred term.

**Event Types** are the templates events are filed against ("Injured Animal", "Snare"). A type sets the icon, the default priority and state, the geometry (a Point type stores `location`, a Polygon type `geometry`), whether its events are readonly, and the **form schema** behind the event's form, **v1** (legacy) or **v2** (current). **Event categories** group types and are the unit of permission: users can only create events in the categories they are granted.

**Incident Collections** are events whose type has `is_collection`, grouping related events (a snare, a carcass and an arrest) through `contains`, each child pointing back through `is_contained_in`. A collection has no reporter, location or time of its own: jumping to it goes to its children, and changing its state changes theirs.

An event can also belong to a **patrol**, when filed during one, and be **linked** to other events.

**UI**
- **Events Feed** (`/events`): the filtered, sorted feed. The filter drives the map too.
- **Event Overview** (`/events/:id`, `/events/new`): a header with the state menu and actions; **Details**, **Activity**, **Links** and **History** (the audit trail) in one scrolling body; and a footer to add notes, files and events and to save with a state transition.
- **Creating an event** always starts from the Add button's event type picker, offered in the Events tab, on the map and its popups, in patrols, and inside an open event. Adding one from inside another event groups both into an incident.
- **Map**: points as markers, clustered with subjects, and polygons as priority-colored fills. Unsaved edits to the open event preview on the map. Events load as vector tiles with a live overlay under the `events_vector_tiles` preview feature, and as GeoJSON for the visible area otherwise.
- **Community input** (`/community/:value/*`): a public page that reuses Event Overview so unauthenticated users can submit events.

**Key files**
- `ducks/events.js`: fetching and saving events, notes and files; the event store, feeds and map events; socket updates.
- `utils/events.js`: titles, priority colors, collections, new-event defaults and filter matching.
- `ducks/event-types/`, `ducks/event-categories/`, `selectors/event-types/`: types, categories, and which types the user can create.
- `ducks/event-schemas/`: form schemas, per event type and event.
- `ducks/event-filter/`, `EventFilter/`: the event filter and its UI.
- `SideBar/EventsManager/`: the Events tab routes, the feed, and Event Overview, whose form lives in `EventOverview/ReportDetailView`.
- `SideBar/useReportsFeed/`: the feed's paginated fetching.
- `AddItemButton/`: the Add button and its type pickers.

### Subjects, Observations, and Tracks

**Subjects** are the monitored entities, located and described by the devices assigned to them: collared animals, rangers, vehicles, aircraft, and fixed sensors such as camera traps or weather stations. A `subject_subtype` (`elephant`, `ranger`, `stationary-radio`) classifies a subject and implies its broad `subject_type` (`wildlife`, `person`, `vehicle`, `stationary-object`); sites define both vocabularies. A subject carries its `last_position` and when it was reported, whether `tracks_available`, and `device_status_properties`, the device's latest labeled readings (battery, temperature, radio state), one of which may be the default.

**Subject groups** are a nested hierarchy configured in the admin. They decide which subjects a user can see and organize the Map Layers subject list. A subject may belong to several groups.

**Sources and observations.** A **source**, the physical device (a GPS collar, a radio, a satellite tag), sends **observations**, timestamped positions with telemetry, which the server attributes to a subject. The client never handles sources: it reads everything by subject.

Some subjects are handled differently:
- **Static sensors** (`is_static`, or the `stationary-object` type) draw as a label showing their default reading, with no track or heatmap.
- **Radios** (`ranger`, `stationary-radio`) report a radio state and their last voice call. Inactive radios can be hidden from Settings → Map, and a radio in alarm plays a sound.
- **Gear** subjects are left out of every subject display; see Gear.
- **Messageable** subjects can be sent messages; see Messaging.

**Loading.** Subject groups, with their subjects, are fetched once at startup, and map subjects for the visible area as the map moves; both merge into one subject store. The socket keeps it live, moving subjects, refreshing their readings, and adding and removing them as the server creates and deletes them.

**Tracks** are a subject's timestamped path, newest first. They load on demand and are cached per subject, fetching only ranges not yet loaded, and socket position updates extend them. Permission caps how far back a user may read, so a short track can be a permission result rather than missing data.

**Track length** is how many days back tracks reach, a custom number or the event filter's "from" date, and survives reloads. **Track state** is hidden (default), visible or pinned; both shown states draw alike. Clicking a subject on the map shows its track, and clicking anywhere else clears every visible track, but not pinned ones.

Tracks can be colored by the time of day they were recorded, in a chosen time zone. The **subject heatmap** is a density surface of the track points of the subjects added to it.

While the time slider is active, each subject sits at its last track point before the virtual date, and tracks and heatmaps are trimmed to the track length ending there.

**UI**
- **Map**: subject icons, clustered with events when clustering is on; static sensors as labels; unread message badges on messageable subjects.
- **Tracks**: a line in the subject's color. Clicking a timepoint opens that observation, with an Add button stamped with its time.
- **Subject popup**: the latest position and readings, and controls for the track, heatmap, messages and the **subject history** modal of its observations.
- **Track and heatmap legends**: the subjects shown, the time-of-day coloring toggle, and Track Settings for track length.
- **Map Layers → Subjects** (`/layers`): the group tree or a flat list. A row controls a subject's visibility, track, heatmap and messages; a group row, all its subjects'.

**Key files**
- `ducks/subjects.js`: fetching map subjects and subject groups; the subject store; socket updates.
- `selectors/subjects/`: the map's subject features, positioned for the time slider; the groups Map Layers renders.
- `utils/subjects.js`: which subjects are static, radios or gear, which can show a track, and positions at the virtual date.
- `ducks/tracks/`, `utils/tracks.js`, `selectors/tracks/`: fetching, caching and extending tracks, track settings, and trimming to the track length and the time slider.
- `ducks/map-ui/`: track state, heatmap subjects, and the map display toggles.
- `ducks/observations.js`: observations for the history modal and timepoint popups.
- `SubjectsLayer/`, `StaticSensorsLayer/`, `TracksLayer/`, `SubjectHeatLayer/`, `MessageBadgeLayer/`: the map layers.
- `SubjectPopup/`, `SubjectControls/`, `TimepointPopup/`, `SubjectHistoricalDataModal/`: the popups, their controls, and the history modal.
- `TrackLegend/`, `SubjectTrackLegend/`, `SubjectHeatmapLegend/`: the legends and Track Settings.
- `SideBar/MapLayersTab/SubjectsTab/`: the Map Layers subject list.
- `Map/index.js`: fetching map subjects as the map moves, subject clicks, and clearing unpinned tracks.

### Patrols

**Patrols** are timed field activities (foot, vehicle, aerial, boat) carried out by a team. They answer who went where, when, and what they found. A patrol itself is thin: a serial number, a title (falling back to its current leg's type, as events do), a priority from its type, notes and files. Everything operational lives on its **legs**, and almost everything the UI shows about a patrol, from its state to its route, is computed here from them.

**Legs** each hold one stretch of the patrol: a patrol type, start and end times and locations, the team and tracking, and the values of two forms, the universal fields (`segment_details`) and the type's fields (`type_details`). Creating a patrol creates its first leg; a running patrol continues with a new leg, possibly of another type, such as on foot and then by vehicle.

> The API calls legs "patrol segments". UI copy says "leg"; code names often follow the API.

**Plan and actuals.** A leg's `scheduled_start` and `scheduled_end` are the plan; its `time_range` (`start_time`, `end_time`) is what happened, and the leg form decides which one a time goes into. A future start saved without "Automatically start" is a plan, fulfilled with the Start action. With it, or with a start in the past, it is written as the actual start, and the patrol begins by itself when it arrives. Ends work the same way. Only the first leg may keep a planned start; later legs begin by themselves.

**Legs run in order,** sorted by their start. When the client adds a leg, it also ends the previous one at the new leg's start, in the same update, if it has no end yet. A leg with no end is read as having ended when the next one began.

**Pauses** are legs marked `is_pause`. Pausing closes the running leg and opens a copy of it as a pause at the same instant; resuming closes the pause and opens another copy. A pause tracks nobody and has no form fields. The API omits pauses from patrol reads unless asked, so every patrol request here asks for them.

**Patrol Types** are the templates legs belong to ("Vehicle Patrol", "Foot Patrol"), setting the name, icon, default priority, and the **form schema** of the leg's type fields. **Universal Patrol Fields** are one site-wide schema every leg renders above its type's fields.

**Team & Tracking** says who went and what reported their position, from choices in the admin's patrol configuration:
- a **team**, only a name, with no members of its own;
- **team members**, people from the configured subject groups;
- **assets**, the vehicles, aircraft, radios and GPS units taken along;
- the **team lead**, the leg's `leader`, which the API and its filter call "tracked by".

**State.** The API stores only `open`, `done` and `cancelled`. The UI computes a richer state from the leg times:

| UI state | Condition |
|---|---|
| `cancelled` | the API state is `cancelled` |
| `done` | the API state is `done`, or every leg has ended |
| `invalid` | no legs, or a first leg with no start of any kind |
| `active` | the first leg has begun and some leg has not ended |
| `paused` | as `active`, and the leg now running is a pause |
| `start_overdue` | not begun, and the first leg's planned start passed more than 30 minutes ago |
| `ready_to_start` | not begun, and its start is less than an hour away (or passed less than 30 minutes ago) |
| `scheduled` | not begun, and its start is more than an hour away |

A leg takes the patrol's state and its place in it: only the first leg can be ready to start or overdue, a leg that never began before the patrol ended or was called off shows as "never ran", and a finished leg stays `done` on a cancelled patrol.

**Status changes** follow the state:
- **Start** (scheduled, ready to start, overdue) begins the first leg now.
- **Pause** and **Resume** switch between a leg and a pause.
- **End** (active, paused) closes every open leg now; a leg that never ran keeps its plan and gets no start.
- **Cancel** (anything not yet over) calls the patrol off and leaves its legs as they were.
- **Restore** (done, cancelled) reopens the legs that ending closed, and the patrol takes whatever state they give it.

**Figures** derived for a patrol and each leg: duration, paused time, active time, distance (the leads' tracks summed leg by leg, or one chosen subject's), and the event count.

**Tracks.** A patrol's route is the tracks of every subject its legs tracked, lead first, each cut to that subject's legs; pauses contribute nothing. They draw once a leg has begun, one line per subject, with pins at the start, the end, handovers and pauses. Visibility cycles like a subject's track, a map click clears visible ones except those led by the clicked subject, and the track length and time slider bound them. While a patrol track is shown, the regular tracks of its subjects are dimmed.

**Events** join a patrol through a leg: an event lists its legs in `patrol_segments`, and a patrol's events are its legs'. An event added from Patrol Overview, or added to a patrol from Event Overview, goes to the running leg, else the last to have run; one added from Leg Overview goes to that leg.

**Mobile patrols.** A patrol run from EarthRanger Mobile carries `provenance: 'mobile'`: while one is under way it takes no new legs and offers only End, and its legs can be edited only once done or cancelled.

**UI**
- **Patrols Feed** (`/patrols`): ordered ready to start → overdue → active → paused → scheduled → done → cancelled, then by the latest leg update, and fetched in one request, kept live over the socket. Its date range is shared with the event filter and matches patrols that overlap it, or only those starting in it. A row's status change applies at once.
- **New Patrol** (`/patrols/new?patrol-type=:id`): from the Add button's patrol type picker; a title and the first leg's form.
- **Patrol Overview** (`/patrols/:patrolId`): the leg table, pauses included, the figures and a timeline under **Overview**, the audit trail under **History**, and a footer to add notes, files and events and to save. A status change here waits for Save.
- **New Leg** (`/patrols/:patrolId/legs/new`): pre-filled from the previous leg, until the patrol is done, cancelled or invalid.
- **Leg Overview** (`/patrols/:patrolId/legs/:legId`): the leg or pause with its state, values, figures and timeline, and a footer to add notes, files and events while it runs, or to edit it.
- **Edit Leg** (`/patrols/:patrolId/legs/:legId/edit`): times bounded by the legs around it; a pause edits only times and locations.
- **Map**: the tracks and pins, and a legend that can hide single subjects.

**Key files**
- `ducks/patrols/`: fetching, creating and updating patrols, notes and files; the patrol store and feed; team and tracking options; patrol track state; socket updates.
- `ducks/patrol-types.js`, `ducks/patrol-schemas/`: patrol types, and the universal and per-type schemas.
- `ducks/patrol-filter/`, `utils/patrol-filter.js`: the patrol filter and the request it becomes.
- `utils/patrols.js`: UI and leg states, status change updates, durations, feed ordering, and map pins.
- `selectors/patrols/`: patrol tracks per subject and leg, distances, tracked subjects.
- `SideBar/PatrolsManager/`: the Patrols tab routes and screens, and the shared `LegForm`.
- `PatrolTracks/`, `PatrolTrackLayer/`, `PatrolStartStopLayer/`, `PatrolTrackLegend/`: the map layers and legend.
- `AddToPatrolModal/`: adding an event to a patrol from Event Overview.

### Gear

**Gear** is ropeless fishing equipment. A **gearset** is a single trap on the seabed or a **trawl** of several, each marked by a buoy **device** that surfaces on command instead of a line to the surface. Manufacturer integrations report it; this client only displays it.

A gearset has a label, a manufacturer, and devices with their positions and last deployment. A set with no located device is not drawn.

**Gear subjects.** A gearset is also a subject (`ropeless_buoy_gearset`, or the older `ropeless_buoy_device`), so gear comes back in subject reads too. The client keeps those subjects out of every subject display, so each set appears once, from the gear list.

**Loading.** The list needs the permission to view gear regardless of location. It is fetched at startup and polled, with no socket updates. Hidden gear always survives a reload.

**UI**
- **Gear tab** (`/gear`): the gearsets, grouped by manufacturer or flat with the grouping and sort controls of Map Layers → Subjects; a row toggles visibility and jumps to the set.
- **Map**: a single set as a point, a trawl as a line through its devices, unaffected by the time slider; either opens the **gear popup**.

**Key files**
- `ducks/gear/`: fetching and polling the gear list, and hidden gear.
- `utils/gear.js`: labels, search, grouping, sorting, and the map features.
- `SideBar/GearTab/`, `GearLayer/`, `GearPopup/`: the tab, the map layer and its popup.

### Spatial Features

**Spatial features** are the map's fixed reference data: boundaries, roads, fences, rivers, water points, ranger posts. Sites load them in the admin; the client only displays them.

They come in three levels:
- a **featureset** (the admin's "display category") is a grouping users toggle, such as "Boundaries";
- a **feature type** belongs to one featureset and sets its features' default style;
- a **feature** has a name, one geometry (points, lines or polygons), and style keys of its own that override its type's, key by key.

**Loading.** The map draws features from vector tiles carrying their resolved style. Map Layers lists them from a featureset summary, fetched when the map loads, with names and bounds but no geometry.

**UI**
- **Map Layers → Features** (`/layers`): the featureset → type → feature tree, with visibility at every level. Jumping to a feature shows it and opens its popup.
- **Map**: clicking a point opens the **feature popup**, whose Add button creates an event or patrol there. Lines and polygons open nothing.

**Key files**
- `ducks/features.js`: the featureset summary.
- `SideBar/MapLayersTab/FeaturesTab/`: the Map Layers feature tree.
- `SpatialFeaturesLayer/`: the vector tile source and its layers.
- `FeatureSymbolPopup/`: the feature popup.

### Basemaps and Quick Links

**Basemaps** are the imagery or cartography beneath the data, set in the admin. The default is the EarthRanger Terrain Map; others are either a Mapbox style, which replaces the whole map style, or a raster tile service (XYZ or WMS). The user's choice survives a reload.

**Map quick links** (the API's "maps") are saved views set in the admin, a center and a zoom, such as a park or one of its sectors. The last one picked, or else the site's default, is the **home map**. The map opens on a link's `lnglat` query parameter, else where the user left it if they chose to restore the map position, else on the home map.

**UI**
- **Base layer control** on the map: the basemap picker.
- **Quick links** in the top bar: picking one jumps there and makes it the home map.

**Key files**
- `ducks/layers.js`, `ducks/maps.js`: the basemaps and the chosen one; the quick links and the home map.
- `MapBaseLayerControl/`: the basemap picker.
- `BaseLayerRenderer/`: the raster basemaps; `EarthRangerMap/` applies a Mapbox style one.
- `Nav/NavHomeMenu/`: the quick links menu.

### Analyzers and Alerts

**Analyzers** are server-side rules that watch the tracks of a subject group and raise an event when the movement matches a pattern: a geofence crossed, a subject near a feature or another subject, a collar that stopped moving, a drop in speed. Their findings reach the client as ordinary events; the client only draws where the spatial analyzers apply.

**Spatial analyzers** are the geofence and feature-proximity ones. The client reads the active ones once at startup and draws their features: a geofence's warning and critical lines or polygons, or a proximity analyzer's features buffered by its distance threshold.

**Alerts** are personal rules for which event types, under which conditions and at which hours, notify a user by email or text message. The server sends them; the client embeds its alerts page in an iframe, in Settings → Alerts and in a global menu modal.

**UI**
- **Map Layers → Analyzers** (`/layers`): the spatial analyzers, to toggle and jump to.
- **Map**: dashed outlines in their warning or critical color. Clicking one opens the **analyzer popup**, which links to its admin page.

**Key files**
- `ducks/analyzers.js`: fetching the spatial analyzers and their features, and buffering proximity ones.
- `AnalyzersLayer/`, `AnalyzerConfigPopup/`: the map layer and its popup.
- `SideBar/MapLayersTab/AnalyzersTab/`: the Map Layers analyzer list.
- `AlertsModal/`: the alerts modal.

### Messaging

**Messaging** is two-way text between users and subjects in the field, carried by the subject's device, such as a ranger's radio or an inReach satellite messenger. An `outbox` message goes to a subject; an `inbox` one comes from its device. A subject can be messaged when it carries a `messaging` array, one entry per capable device, and the client always sends over the first.

**Delivery is not instant.** A sent message starts `pending` and turns `sent` or `errored` once the provider answers; incoming ones arrive `received`. A sent message appears only when the socket echoes it back.

**Read state is shared.** `read` is one flag per message for the whole site, so opening a subject's thread marks its messages read for everyone. The top bar counts every unread message, and the map badges count them per subject.

**UI**
- **Messages menu** in the top bar: the latest message per subject, each opening its thread, and New Message.
- **Subject messages**: a subject's thread and input, from the subject popup, its Map Layers row, or its map badge.

**Key files**
- `ducks/messaging.js`, `utils/messaging.js`: fetching, sending and marking messages read; which messages and subjects are shown.
- `Nav/MessageMenu.js`, `MessageList/`, `MessageInput/`, `MessagingSelect/`: the top bar menu, the message lists, the input, and the subject picker.
- `SubjectMessagesPopover/`, `SubjectMessagesPopup/`, `MessageBadgeLayer/`: the thread from subject controls and from a badge, and the badges.

### Time Slider

The **time slider** replays the map at a past moment, the **virtual date**, so the control room can see where subjects were and what had been reported when something happened. It moves within the event filter's date range, up to its end or now, and starts at the end; changing the range sends it back there. The virtual date is client-only: no request carries it, and closing the slider or reloading returns to the present.

While it is open:
- events reported after the virtual date are hidden and the rest fade with their distance from it; an event's state is not rewound;
- subjects, tracks, heatmaps and patrol tracks follow it as their sections describe, nothing drawn reaches back before the range's start, and the map fetches only subjects updated within the range;
- clustering is off.

**UI**
- **Time slider**: a bar along the bottom of the map to drag or play through the range, opened from its map control, with a date picker that edits the event filter's range.

**Key files**
- `ducks/timeslider.js`: whether the slider is open, and the virtual date.
- `TimeSlider/`, `TimeSliderMapControl/`: the slider and its map control.
- `selectors/events.js`, `utils/event-vector-tiles.js`: hiding and fading map events at the virtual date, for the GeoJSON and vector tile paths.

### Coordinate Systems

Positions are stored and sent as **WGS84** longitude and latitude, but users read and type them in the format they choose: DEG, DMS, DDM, UTM, MGRS, or a **coordinate reference system** added from the EPSG registry bundled with the client. DEG is always offered and is the fallback.

**One format everywhere.** The chosen format is a single preference: every coordinate shown or typed follows it, and changing it from any format toggle changes it app-wide. Settings decide which formats the toggles offer. A point outside an added system's area of use has no value in it, so it shows in DEG or as unavailable, and while such a system is chosen the map outlines its area. These choices live in the browser, not in the user's account.

**UI**
- **Settings → Map → Coordinate systems**: the offered formats, and adding an EPSG system.
- **Location picker**: a position typed in the chosen format or picked on the map, for events, patrol legs and form location fields.
- **Cursor coordinates** on the map: the pointer's position, and a search that jumps to coordinates or a place.

**Key files**
- `utils/location/`: parsing and formatting every format, and loading the EPSG registry.
- `ducks/coordinate-reference-systems/`: the offered formats and the added systems; the chosen one is a user preference in `ducks/user-preferences/`.
- `GpsFormatToggle/`, `GpsInput/`, `LocationPicker/`, `CursorGpsDisplay/`: the toggle, the coordinate input, the location picker and the cursor coordinates.
- `SideBar/SettingsPane/MapTab/CoordinateSystemSettingsView/`: the settings screen.
- `Map/layers/useCrsBoundingBoxLayer/`: the area outline.

### Accounts and Access

**Signing in.** The site's status, read before anything renders, sets one way to sign in:
- **Username and password** (`require_idp` off): the DAS OAuth password grant.
- **Auth0** (`require_idp` on): through the organization's identity provider, or EarthRanger Identity where it has none. These sites are mid-migration, so an account not linked yet goes to the server's account linker. A site may also offer a **managed user** button, for accounts in its own Auth0 connection.

Either way the client gets an access token, Auth0's used as is, kept in a cookie and in Redux and sent as a `Bearer` header.

**Sessions.** Without a token the app redirects to login, and where the EULA is enabled, to the EULA until the user accepts it. A 401 renews the token silently, or sends the user back through Auth0 when the server asks for a fresh second factor; only when that fails is the session cleared. Signing out drops the token, the selected profile and every globally resettable slice.

**Profiles** are other accounts a user may act as, PIN-protected when they have one. The chosen profile survives a reload; while it is active, requests carry a `USER-PROFILE` header and permissions come from the profile.

**Geographic permissions** let some users see only the events near them, so the client sends the device's location with event requests.

**UI**
- **Login** (`/login`) and **EULA** (`/eula`).
- **User menu** in the top bar: switch profile, sign out.

**Key files**
- `Login/`, `Auth0TokenManager/`: signing in, and the Auth0 callback with account linking.
- `RequireAccessToken/`, `RequireEulaConfirmation/`, `views/EULA/`: the guards and the EULA page.
- `ducks/auth.js`, `ducks/user.js`: the token, the user and their profiles.
- `utils/auth-recovery.js`, `hooks/useAuthRecovery.js`: the 401 recovery.
- `utils/geo-perms.js`: which users are geographically restricted.
- `UserMenu/`, `ProfilePINModal/`: the user menu and the profile PIN prompt.

### App Chrome

The map fills the screen, framed by a top bar, a sidebar and a global menu. On small layouts the sidebar's icon rail moves into the global menu, and an open tab covers the map.

**Top bar:** the global menu button, the logo, the map quick links, the system status, messages, notifications, and the user menu.
- **System status** rolls four health checks into one badge: the browser's network, the server, the realtime socket, and each data integration's last heartbeat. It is how the control room tells a quiet site from a broken feed.
- **Notifications** hold EarthRanger announcements and, when a new client version is installed, the prompt to reload.

**Sidebar:** an icon rail and one panel, opened by the URL. The panel shows when the path starts with an enabled tab, and closing it goes to `/`, where the map shows a floating event filter. A hidden tab's route redirects to `/`.

| Tab | Condition |
|---|---|
| **Events** | `EVENTS` flag |
| **Patrols** | `PATROL_MANAGEMENT` flag + patrol read permission |
| **Gear** | the site has gear |
| **Map Layers** | `ANALYZERS`, `SPATIAL_FEATURES`, `SUBJECTS` or `EVENTS` flag |
| **Settings** | always |

**Map Layers** has Subjects, Features, Analyzers and Events sub-tabs, each behind its own flag; the first three share one search. Events shows or hides events on the map and toggles their heatmap. What a user hides survives a reload only if they chose to restore map layers in Settings → General.

**Settings** has three sub-tabs:
- **General**: which UI state survives a reload, the UI language, sounds, and overrides for the development feature flags in use.
- **Map**: map behavior and display options, and coordinate systems.
- **Alerts**: the alerts page, behind the `ALERTS` flag and the alert rule read permission.

**Global menu:** a drawer from the menu button, with Tableau, the alerts modal, Contact Support, help links, data exports, Ecoscope links, and the versions and legal links. Each export needs its own flag or permission, and the field reports export applies the current event filter.

**Key files**
- `Nav/`: the top bar.
- `SystemStatus/`, `ducks/system-status.js`: the system status and its health checks.
- `NotificationMenu/`, `ServiceWorkerWatcher/`: notifications and the new version prompt.
- `SideBar/`: the rail, the panel, and which tabs show; `SideBar/MapLayersTab/` and `SideBar/SettingsPane/` hold their sub-tabs.
- `ducks/map-layer-filter/`: what Map Layers hides, its search, and its grouping and sort.
- `GlobalMenuDrawer/`, `Drawer/`: the global menu.
- `ducks/modals.js`, `ModalRenderer/`: the modal stack every modal opens through.

## Architecture

### Technical Stack

- **Runtime and tooling:** Node 24, Yarn 4, Vite 8, ESLint, Stylelint
- **UI:** React 19; `react-bootstrap` (Bootstrap 5); Sass modules
- **Routing:** React Router 8 declarative mode, with `BrowserRouter`
- **State:** Redux 5 + `redux-thunk`, `redux-promise`, `reselect`; persistence via `redux-persist`
- **Map:** Mapbox GL
- **HTTP and real-time:** Axios, Socket.IO
- **Auth:** `@auth0/auth0-react`
- **Geo and utilities:** `@turf/turf`, `proj4`, `geodesy`, `date-fns`, `lodash`, `@dnd-kit`
- **i18n:** `i18next`, cached in localStorage in front of the HTTP backend
- **Testing:** Jest with `jest-fixed-jsdom`, React Testing Library, MSW, `socket.io-mock`
- **Analytics:** `react-ga4`
- **Delivery:** Workbox service worker

All application source is `.js`, including JSX — Vite compiles every source `.js` as JSX. Environment variables are exposed under the `REACT_APP_` prefix.

### Project Structure

- `src/index.js`: bootstrap and top-level routes
- `src/App.js`: the authenticated shell
- `src/config.js`: the Auth0 config, overridden per environment at runtime
- `src/store.js`, `src/reducers/`: store wiring, the root reducer, per-slice persistence, and the sign-out reset
- `src/{ComponentName}/`: component folders, nested under their parent once they belong to one
- `src/common/`: shared assets and global SCSS partials
- `src/ducks/`, `src/selectors/`, `src/hooks/`, `src/utils/`: Redux logic per domain, reselect selectors, shared hooks, general utilities
- `src/views/`: full-page views rendered outside the app shell
- `src/constants/`: shared constants, route patterns, and every env variable
- `src/setupTests.js`, `src/test-utils.jsx`, `src/i18nForTests.js`, `src/__test-helpers/`, `jest-config/`: test setup, the provider-wrapping `render`, fixtures and mocks

### Routing

The app is mounted under `REACT_APP_ROUTE_PREFIX`. `constants/routes.js` holds the top-level routes: login, EULA and community sit above the shell, and everything else falls through to the authenticated app. Inside it, `SideBar/` routes each tab by its `TAB_KEYS` segment (`events`, `patrols`, `gear`, `layers`, `settings`), and the Events and Patrols managers nest their own routes. Elsewhere, read the tab and item from the URL with `getCurrentTabFromURL` / `getCurrentIdFromURL` in `utils/navigation.js`.

Navigate with the app's `hooks/useNavigate`, not React Router's, so a form with unsaved changes can prompt before the user leaves.

### State and Data Loading

- `state.data` holds API data; `state.view` holds UI state.
- All Redux logic for a domain lives in its duck. Derived state belongs in a reselect selector, not in a component.
- Slices that must survive a reload are wrapped in `persistReducer` at the root; slices that must be cleared on sign-out are wrapped in `globallyResettableReducer`.
- Reference data every screen depends on (types, schemas, categories, quick links, subject groups, analyzers, team and tracking options) is fetched once when the shell mounts. Screens read it from the store rather than fetching it again.

### API Layer

Ducks call Axios directly with `API_URL` / `API_V2_URL` from `src/constants/`. `RequestConfigManager` configures the shared instance: the `Bearer` token, the `USER-PROFILE` header while a profile is active, and the 401 recovery. `skipAuth` does not drop the token; it only keeps a public or best-effort request out of that recovery.

### Real Time

`withSocketConnection` opens one Socket.IO connection for the authenticated shell and shares it through `SocketContext`. The client sends the server its event and patrol filters, again whenever they change, and the server tags each event and patrol push with whether it still matches them, so the ducks' `socket*` handlers add, update or drop the object without refetching. Store-wide handlers are bound in `withSocketConnection/`; a component that needs a push only while mounted subscribes through `SocketContext` and unsubscribes on unmount.

### Map

One Mapbox instance, created by `EarthRangerMap/`, is shared through `MapContext`. Register sources and layers with `useMapSources` / `useMapLayers`, which add and remove them with the component, and keep their ids in `SOURCE_IDS` / `LAYER_IDS`.

### Form Schemas

A current (v2) schema is a `{json, ui}` pair: a JSON Schema that validates the values, and a layout of fields, headers and sections. The client fetches it with `pre_render`, so the server fills in the choice lists, and turns both halves into one flat **formElements** map (`utils/form-schemas/`) that `SchemaForm` renders and validates. Legacy v1 event schemas render through `@rjsf`.

### Feature Flags and Permissions

Three separate gates, often combined on one element:

- **System config flags** (`SYSTEM_CONFIG_FLAGS`, in `state.view.systemConfig`) come from the site's status and say whether a feature exists at all. Most count as on when the server omits them.
- **Preview features** (`PREVIEW_FEATURES`, read with `usePreviewFeature`) roll an unfinished feature out one site at a time, sometimes by switching between two implementations. One the server omits is off.
- **Development feature flags** (`DEVELOPMENT_FEATURE_FLAGS`, read with `useFeatureFlag`) are client-side defaults for work in progress, overridable per user from Settings → General.

Permissions come from the user, or the active profile, through the `use<Domain>Permissions` hooks in `hooks/usePermissions/`.

### Analytics

Current UIs put a category-scoped tracker on `TrackerContext` at the top of a feature and call `tracker.track(...)` from descendants, so no component names its own category. Older code builds a module-level `trackEventFactory(SOME_CATEGORY)` instead. Either way, an action is a readable sentence describing what the user did.

## Conventions

The repository favors code that reads the same everywhere. ESLint and Stylelint own a small part of that; everything below is convention they do not enforce, and it is expected in new code and in code you touch. Keep lines under about 120 columns.

### File and Folder Layout

- Every component, hook, helper and error class is a folder with an `index.js`, beside its `index.test.js` and, for a component, its `styles.module.scss`.
- Helpers for a component or its subtree live in a sibling `utils/` folder, one function or hook per subfolder, default-exported under the folder's exact name; shared literals go in `utils/constants.js`.
- **Rule of three:** a helper earns that folder once three call sites need it. At one or two, keep the logic inline or as a module-level helper in the file that uses it. The exception is a large component whose involved logic is worth naming and testing on its own: extract it then, deliberately.
- Utilities shared across the app are flat, domain-named files directly under `src/utils/`.

### Imports

Group imports into blocks separated by a blank line, in this order:

1. External packages, `React` first.
2. SVG icons: `import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';`
3. Internal non-components: constants, ducks, selectors, hooks, utils, and the module's own `./utils` helpers.
4. Components: app components, subcomponents, and lazily imported ones.
5. `import * as styles from './styles.module.scss';`

Sort each block alphabetically by the first imported binding, not by path. Reach into a package for a single export rather than pulling its barrel: `react-bootstrap/Overlay`, `lodash/omit`.

### Declarations and Naming

- Arrow functions everywhere.
- Module-level constants in `SCREAMING_SNAKE_CASE` above the component. Anything a test needs to reach is exported inline; there is exactly one default export, at the bottom of the file.
- An empty array, object or set used as a default or a fallback is a module-level `EMPTY_*` constant, so selectors and hooks keep referential equality across calls.
- Names are verbose and explicit over short and obscure.
- Collections are plural, and iterating one names its parameter that same word in the singular: `events.some((event) => event.id === eventId)`. A second parameter of the same kind takes an `other` prefix (`(timeRange, otherTimeRange)`).
- Booleans start with `is`/`has`/`can`/`should`; refs end in `Ref`; setters start with `set`. Handlers and handler props are `on` plus the event they handle, while a function that performs an action keeps its verb (`closeMenu`).
- Selectors start with `select`, and whatever takes their value drops it: `selectPatrolTypes` gives `patrolTypes`, in `useSelector` reads and `createSelector` result functions alike.
- Avoid a variable read only once. Prefer the readable one-liner, and introduce the variable only when its name is what makes the code readable.
- Avoid destructuring anywhere but a component signature: `leg.startTime` keeps the origin of the value visible, while `const { startTime } = leg;` and `.map(({ id }) => id)` hide it. The one exception is unpacking a constants object at module level, where the origin is already in the line: `const { ACTIVE, DONE } = PATROL_UI_STATES;`.
- Reach for `?.` and `??` when a value may be absent. `||` is for a genuine falsy check, not a stand-in for them.
- Mapping a domain value to a result is a `SCREAMING_SNAKE_CASE` lookup object, not a chain of `if`s: `STATES_BY_PATROL_STATE`, `PRIORITY_COLOR_MAP`. Name it `X_BY_Y` when keyed by a domain value, `X_MAP` otherwise. Reducers keep their `switch`.
- Conditions read positively. A single branch wraps its logic rather than guarding with a bare `return;`; an early return that yields a value is fine.

### Alphabetical Ordering

Sort alphabetically, so diffs stay small and merge conflicts stay rare:

- object literal keys — action objects (`{ payload, type }`), reducer state, option objects, configuration, fixtures;
- JSX props, `aria-*` included, with `{...otherProps}` last;
- destructured props in a component signature, and named import bindings;
- declarations within each group of a component body, by the name they bind;
- translation JSON keys, case-insensitively, nested and flat interleaved;
- CSS declarations within a rule.

Function parameters follow the call's own logic, not the alphabet.

### Component Structure

- Functional components with hooks. No PropTypes.
- Props destructured in the signature with defaults inline. `ref` is a plain prop. A component that wraps a DOM element collects the rest into `...otherProps` and spreads it last onto the root element.
- Body order, groups separated by a blank line: library hooks (`useDispatch`, `useTranslation`, router hooks), app hooks, `useSelector` calls, `useContext`, `useRef`, `useId`, `useState`, derived variables, `useMemo`, handlers, `useEffect`, then the returned JSX.
- Memoize only when it pays: for a dependency array, for a genuinely expensive computation, or for the props of a `memo` boundary you checked actually bails. Never to spare a field or two a re-render. In practice that makes the presentational children of a stateful container good `memo` candidates, and the container itself a poor one.
- Return JSX bare — `return <Popover …>;`, never wrapped in parentheses. A component with nothing to show returns `null` from an early return.
- Render conditionally with `&&`; a ternary only when both branches render something.
- Compose a className as a template literal with the module's own class first and each modifier as `condition ? styles.modifier : ''`.
- JSX: a blank line between sibling elements at the same indentation level, one-line inline arrows for trivial handlers, a local `render*` helper for JSX rendered in more than one place, and `type="button"` on every button.
- A `data-testid` is named `<componentName>-<element>` (`timeSlider-wrapper`).

### Redux

- A duck is laid out in this order under `// Actions`, `// Action creators` and `// Reducer` banner comments: URL and tuning constants, action type constants, action creators, `INITIAL_STATE`, the reducer, default export. A domain holding several slices exports its reducers named instead, one `INITIAL_*_STATE` and reducer pair each.
- Action types are namespaced strings in `SCREAMING_SNAKE_CASE` (`'USER_CONTENT.SET_CHUNKED_UPLOAD_STATUS'`) and are exported, as are the API URL constants and `INITIAL_STATE`, so tests can mock and assert against them.
- Action creators return `{ payload, type }`; thunks are `(args) => (dispatch, getState) => …` and use `async`/`await` rather than promise chains.
- An action creator's name is the verb it performs: `fetch*`, `create*`, `update*`, `set*`, `add*`, `remove*`, `clear*`, `toggle*`, `show*`/`hide*`. A handler for a server push is `socket*`.
- A failed request is caught and logged with `console.warn` and a message naming the operation. Never `console.error` or `console.log`.
- Reducers are a `switch` returning new state.
- Selectors live under `src/selectors/{domain}/`: unexported input selectors and plain helpers at the top, then exported `createSelector` selectors. Parametrized selectors take the parameter as a second input, `(_, eventTypeId) => eventTypeId`.
- `createSelector` takes its inputs as an array on its own line and the result function last.

### Styling

- Component-specific styles go in a co-located `styles.module.scss`; global partials live in `src/common/styles/`; a subtree that repeats a pattern across its components keeps its own `_shared.scss` of mixins at its root.
- Pull colors, layout breakpoints and mixins from those partials with `@use`; never hard-code a value that already exists as a variable.
- Class names in camelCase, naming the element's role inside the component rather than how it looks: `.menuItemOption`, `.legTableWrapper`, `.titleBarMain`.
- Nest selectors to mirror the component's own DOM structure; keep media queries at the end of the block they modify.
- Sizes, spacing and radii in `rem`. `px` is for hairlines only — borders, outlines and shadows.
- Derive a hover, active or disabled shade from the variable with `color.adjust`; never introduce a second hex for it.
- Anything interactive styles `:focus-visible`, not only `:hover`.

### Internationalization

- Translation files live under `public/locales/{locale}/`, one JSON file per UI namespace. Within a namespace, give each top-level component its own key, named after the component, and nest a child's key under its parent's when that child is a subcomponent below the parent folder.
- Read strings with `useTranslation('<namespace>', { keyPrefix: '<path>' })`, where the key prefix mirrors the component's position in the folder tree. Outside components, use `i18next.getFixedT(null, '<namespace>', '<keyPrefix>')`. A second prefix in the same component is aliased (`{ t: tStatusPill }`).
- Key names describe the element and its role, ending in the role noun — `Label`, `Title`, `Message`, `Placeholder`, `Tooltip`: `closeButtonLabel`, `resultsTableCaption`, `speedMenuOptionLabel`.
- Interpolate with `{{name}}`, and let i18next pluralize through `_one` / `_other` keys rather than branching on a count in the component.
- Call `t` inline where the string is used rather than holding its result in a variable, even when that repeats the call.
- Every user-facing string, including `aria-label` and `title` text, goes through i18n and is added to **every** locale, properly translated — never copied from English.
- Match the wording a locale already carries: one term per domain noun across a namespace, one regional variant and one level of formality per locale, and the same value for a message that already exists under another key.

### Comments

Comment only what the code cannot say — a non-obvious *why*, a caveat, an external reference. If naming and structure can carry it, no comment is written. Anything that restates what the code does is noise, and most code needs none at all.

- **One line, one reason.** Take a second line only when the first cannot carry the reason, never a third, and cut any sentence that argues the same point again. `//` only, each line at most 80 columns, however wide the code nearby.
- **Directly above the line it explains**, as a full sentence ending in a period. A comment above a function is for a caveat that governs the whole of it, never a summary of what it does — if a function needs that summary, its name is wrong or it is doing too much.
- An `eslint-disable` line always carries the reason it is there.
- A `TODO` is only for a blocker outside this repository, and says what it is waiting on. Otherwise, never leave working notes behind: no narrating the change (`// now using X instead of Y`, `// this fixes the bug`), no ticket numbers, no references to plans or conversations that exist only on your machine. The diff and the commit message are for that.
- None at all in `styles.module.scss` or test files, even for the subtle case. Test intent goes in the `describe` / `test` names: rename or split instead. Why production code is surprising belongs in the production file.

### Accessibility

- **WCAG 2.1 AA** compliance.
- Prefer **semantic HTML** over custom abstractions, and use **ARIA only when native semantics are insufficient**.
- Every interactive element is reachable and operable by keyboard, with a visible focus state and correct roles, names and states.
- A custom menu or listbox owns its keyboard model (arrows, Home/End, Escape, Tab) and returns focus to its trigger when it closes.
- Generate element ids with `useId`; mark decorative icons `aria-hidden`.

### Testing

- Co-located `index.test.js` beside the module it covers. Imports follow the app's block order, with the module under test imported last in its own block as `from './'`, followed by the file's `jest.mock` calls.
- `describe('<path>')`, where the path mirrors the folder chain joined by ` - `. Top-level components use just their name. Nest a `describe` per exported function when a module exports several.
- `test('<third person present tense>')`: "shows the…", "does not render…", "updates the lock map setting when the user interacts with its checkbox".
- Set mutable fixtures and handler mocks in `beforeEach`. Then declare a local render helper — `renderGeneralFieldSet`, `renderStatusSelect` — that wraps the component in whatever providers it needs and accepts prop and store overrides, plus small query helpers where a query repeats.
- `render` and `screen` come from `src/test-utils`; pass `initialEntries` when the component reads the URL. Supply Redux state with `mockStore` from `src/__test-helpers/MockStore` and reuse the fixtures in `src/__test-helpers/`.
- Drive interactions with `userEvent`, and `await` every call. Query with `getByRole` and the accessible name, and with `getByTestId` only where no accessible query reaches the element.
- Assert through the `jest-dom` matchers — `toBeVisible`, `toBeInTheDocument`, `toHaveAttribute`, `toHaveTextContent`, `toHaveClass` — and on dispatched actions, rather than reading DOM properties by hand.
- Mock a duck by spreading `jest.requireActual` and replacing only the action creators used, and give thunks `mockImplementation(() => () => {})`.
- Mock HTTP with MSW: build the `setupServer` handlers from the duck's exported URL constants and wire `server.listen` / `resetHandlers` / `close`. Provide the map with `createMapMock` through `MapContext.Provider`, and analytics with a `TrackerContext` value whose `track` is a `jest.fn()`.
- A test that would have passed before your change is not a regression guard. Check that each new test fails against the old behavior.

## Workflow

### Commands

- `yarn start`: Vite dev server on port 9000, against the development backend at https://root.dev.pamdas.org. Each developer configures it in `.env.development`.
- `yarn build`: production bundle, then the service worker
- `yarn test <path-or-pattern>`: Jest. It pins `TZ=UTC`; a bare `jest` invocation will fail datetime tests on any other machine timezone.
- `yarn lint`: ESLint over all of `src`, which carries pre-existing problems. To see only yours, run `npx eslint` on the files you touched.
- `yarn stylelint`: Stylelint over the SCSS modules
- `yarn check-i18n-files-version`: verifies the translation cache version was bumped

### Scope

Follow the boy scout rule: leave a file you touch better than you found it. That rule has a boundary — improvements stay inside the files the task already takes you to. Do not open a neighboring file to tidy it, and do not widen a fix into a refactor.

Older code that departs from these conventions is neither migrated nor copied: match this file, not the file you are reading.

### The Polish Pass

Before you call the work done, reread what you wrote — every changed hunk, not from memory — and improve it. This is judgment, not a lint step. Go through these in order, and fix what you find:

1. **Correctness.** What input makes this wrong? Empty collections, absent dates, a patrol with no legs, a subject with no position.
2. **Readability.** Would a reviewer understand this without asking? Better names beat more code, and more code beats a comment explaining a bad name.
3. **Conventions.** Reread against the sections above — ordering, imports, component body order, naming. Drift here is the most common review comment.
4. **Cost.** Work repeated per render or per item, a selector that rebuilds an array each call, a `useMemo` that guards nothing, a memo boundary that never bails, a listener never removed.
5. **Semantics and accessibility.** Native element over a div, keyboard path, focus after the interaction, roles and names a screen reader will announce.
6. **Translations.** Every new string in every locale, genuinely translated, and matching the wording those locales already use.
7. **Comments.** Delete each one that says what the code says, and shorten every two-line comment that one line would carry. Keep only the *why*.
8. **Tests.** Cover the behavior you changed, at the level the change lives at.

### Before You Commit

- Run `yarn lint`, and `yarn stylelint` if you touched SCSS. Fix every problem you introduced.
- Run `yarn test` over the areas you changed and make sure they pass.
- If you changed anything under `public/locales/`, bump `I18N_FILES_VERSION` in `src/i18n.js` above develop's and verify with `yarn check-i18n-files-version`.
- Update this file only under the terms in **Maintaining This File**.
