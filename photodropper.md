# Photodropper

Photodropper is a webapp that allows you to display photos on a TV screen during a party or social event, by uploading photos to a server.

There are two kind of users:
guests - users that attent the event and provide photos and comments (anonymous)
event administrators - users that create and manage events (authenticated using fixed password for all events)

## Main screen

The screen displays a slideshow (animated) of the photos, and a QR code (left top) that functions as the upload link. 
When the app is running, the slideshow should play automatically.

The content for the main screen is determined by retrieving a playlist from backend (query parameters are event_id, current_version of the playlist). 
This is done every second (interval set in milliseconds with a .ENV variable, wait for set interval after each poll cycle). 

### Slideshow

The screen displays a slideshow of images based on the playlist. See the backend playlist creation section for details of the playlist.

The current photo is shown during at least a minimum duration (set in event record) or for as long as it takes for all corresponding photo_comments to scroll out of sight

### Ticker

The screen displays a ticker bar (bottom) with two rows that display comments.
The top row shows comments linked to the current photo (photo ticker). 
The bottom row shows comments linked to the current event (event ticker).
The bar height is fixed to the size of the two rows, even if one or two rows are hidden.

The comments in each ticker are looped and scroll from right to left. If there are no comments in the ticker row, the row should be hidden (the bar is anchored to the bottom of the screen). 
If a comment is still visible when the loop reaches the end, a blank comment should be scrolled in from the right until the comment is no longer visible.
For the formatting, make it look like the ticker in the RTL-Z screenshot, but keep a margin on the left, right and bottom of the ticker

Scroll speed is 0% (not scrolling) - 100% (fastest) and is set in the event record for both rows separately

### Date and location

In the right top corner, the app displays the photo location (if available) and the date taken (if available). [Like the CNN screenshot]
Use smart formatting for the date: today, yesterday, last week, last month, [day month] for other entries in this year, [day month year] for other entries

### Actions for guests

The QR code contains a unique link that redirects to an action page and a unique identifier that is associated with the photo on display.
The QR should change for each photo in the slideshow while the slideshow is playing so that comments are associated with the correct photo. 

Scannong the QR code with a phone should open the action page. On this page guests can:
- UPLOAD PHOTO:upload a photo to the server.
- COMMENT ON PHOTO:add comments to the photo ticker.
- COMMENT ON EVENT:add comments to the event ticker.

### Uploading a photo

Pressing the upload button should open a popup with a form to upload a photo.

The form should initially have the following fields:
- photo (file input)
- upload button

During upload and backend processing, the location and date are filled in automatically based on the photo metadata if available.

During first upload, the photo is set to invisible

Once the photo is uploaded successfully, the form should be updated with the following fields:
- name (text input, may be empty, show a placeholder "Anonymous", store the name in local storage and reuse it for future comments and uploads)
- comment (text input, may be empty)
- location (text input, may be empty)
- date (date input, may be empty)
- button "Cancel" -> deletes the photo in the backend
- button "GO!" -> submits the info, sets the photo to visible and closes the popup

During long operations (upload) a spinner should be shown. Clear warnings and error messages are required when operations fail.

### Commenting

Pressing the comment button should open a popup with a form to add a comment (photo or event).

(names should not be longer than 10 characters)
(comments should not be longer than 100 characters)

The form should initially have the following fields:
- name (text input, may be empty, show a placeholder "Anonymous", store the name in local storage and reuse it for future comments and uploads)
- comment (text input, show a placeholder "Add a comment")
- button "Cancel" -> closes the popup
- button "GO!" -> submits the comment, closes the popup, disabled when comment is empty

When comments are added, the ticker should show the comments in the order that they were added.

## backend functions

### storage

### Creating playlists

The playlist is filled using a scheduling mechanism.

The scheduling mechanism is built in such a way that multiple clients can playout the program synchronously. 

There are separate playlists for the photo stream and the event comment streams.

A comment stream has this format:
  * index (integer, 0-based)
  * comment
  * commenter_name (optional)

A photo stream has this format:
  * index (integer, 0-based)
  * timestamp_start (timestamp or null) 
  * photo_url
  * uploader_name (optional)
  * date_taken (optional)
  * coordinates (optional) (string:latitude, longitude)
  * location (optional) 

The full playlist has this format:
  * version (integer, 0-based)
  * photo_stream
  * photo_comment_stream (zero or one streams per photo, sparse structure)
  * event_comment_stream

The backend checks the current_version on the client against the playlists (creates a new one if required) and returns all items newer than the channel_index.

When a comment is added to the visible photo, the visible photo remains visible until the new comment has scrolled offscreen. 
When comments are added to a photo that is no longer visible, the photo is rescheduled for display (does not count for the scheduling limit)

## Actions for the host

When the app main page is clicked, a password dialog should appear. The popup appears without clicking if there is no active event

The password is "photodropper".

If the password is correct, the app should navigate to a management page.
If the password is incorrect, the app should display an error message.

The management page has a title bar with a new event button, a event selection dropdown, and a close button.

The management page has tabs for:
* Events
  - shows a list of events as badges (there is an edit icon next to the event name)
  - clicking on the event badge sets the event as active and closes the popup
  - clicking on the edit icon on the event badge should open an edit event popup (with a form to edit the event name or delete the event)
* Photos
  - shows a list or grid of photos: clicking on a photo should open a popup with the photo (with a form to edit the photo metadata, hide the photo, or delete the photo)
  - toggle between list and grid view
  - The photos tab should have a button to upload one or more photos.

* Comments
  - shows a list of comments
  - clicking on a comment should open a popup with the comment
* Settings
  - ... to be added

## Data model

A table called "photos" with the following columns:
* id
* event_id
* index
* photo_url
* uploader_name (optional)
* date_taken (optional)
* coordinates (optional) (string:latitude, longitude)
* location (optional) 
* visible
* updated_at
id -> unique
(event_id, index) -> unique

A table called "comments" with the following columns:
* id
* event_id
* photo_id (null for event comments) -> linked to photos.id
* index
* comment
* commenter_name (optional)
* visible (boolean)
* created_at
* updated_at
id -> unique
(event_id, photo_id, index) -> unique

A table called "social_events" with the following columns:
* id
* name
* created_at
* updated_at
* photo_duration_ms (default 5000)
* scroll_speed_pct (default 50, 0 - 100)
id -> unique

The browser running the slideshow should keep the app status in local storage.
* active_event_id
* current_photo_index
* current_photo_comment_index
* current_event_comment_index
* current playlist
* current playlist version

All uploads (photos, comments) are anonymous.

# data storage

The backend will store the photo data in a folder on local storage. Use \event_id\YYYYMMDD_HHMMSS_<index>.<extension> as relative path. Set the absolute location in an .ENV file


# nextjs client to backend api

Each table should have a CRUD API endpoint. Create types for the expected input and output data. Use ZOD for data validation in the API. PUT and DELETE endpoints should be authenticated, GET and POST should be public, but rate limited.

There should also be a public endpoint for uploading (public) and deleting (only authenticated) photos

# security

Use NextAuth with a CredentialsProvider to login the user. No user management is necessary, the provider only receives a password. A default user is created when the password is ok.

# Non functional requirements:
* Using a local store to store the photos
* Using a local storage to store the photos, comments, and events tables (JSON?)
* Using a local storage to store the password
* Using the nextjs platform
* Use redux + hydration from / to local storage for state management
* Use tailwind for formatting
* Create separate components for image display, ticker, metadata display (date / location)
* The management and upload / comment pages should be designed for mobile devices. On non-mobile devices, center the content above the main photo display page (without freezing the slideshow and ticker).

# Ideas for future features

##spotify integration
* Create a shared playlist for the event.
* Add songs to the playlist
* Show current song title in ticker

##Replay
* Replay the event after it has ended.

##Scheduling
* setting from and to dates for photos in the event (so that photos can be uploaded before the event starts)
* setting from and to dates for comments in the event (so that specific comments can be entered before the event starts)
* Intelligent setting this by selecting multiple photos and comments and setting the from and to dates for them
* Use schedule columns in the photos and comments tables:
  * show_from (timestamp, null if immediately shown)
  * show_to (timestamp, null if immediately shown)

##Managing your photos and comments
Ideally, the app should keep 
a list of uploaded photo IDs in local storage so that the uploader can see stats and comments for their photo.
a list of comments added by the user
- extra action in the QR popup: MY PHOTOS -> shows a list of photos uploaded by the user, hide action for the photo, stats action that shows the number of times the photo has been shown and the comments that were added to it
- extra action in the QR popup: MY COMMENTS -> shows a list of comments added by the user, hide action for the comment

## Call to action
show intermediate screens / filler screens / filler content
* Hey you, upload a photo, Hey you, add a comment, us army join picture of lincoln pointing at the guest
* drink photo
* spotify song related cover photo

## limits and stats

* limit the number of times a photo can be scheduled for display
* limit the number of times a photo comment is shown in the phototicker
* limit the number of times an event comment is shown in the event ticker
* Use statistics columns in the photos and comments tables:
  * schedule_count (integer, 0 if not scheduled yet)
  * show_count (integer, 0 if not shown yet)
  * last_shown (timestamp, 0 if not shown yet)
* show count can be larger than schedule count if a photo is shown multiple times because of comments being added to it while it is not visible

# re-use from other projects
- file upload from veiligstallen (from example-code folder: )
## qr code display from build-the-loop
- uses qrcode.react from https://www.npmjs.com/package/qrcode.react
````
import { QRCodeSVG } from 'qrcode.react';

````
        <Center>
            <QRCodeSVG 
              value={<encodedvalue>}
              size={256}
              level="H"
            />
        </Center>
````



# Project steps

1. Create a nextjs/typescript basic app with the relevant libraries added and working
- next-auth
- supabase integration
- tailwind formatting
- zod
- reduxjs/toolkit
- react-redux
- redux-persist

2. Create the supabase database
- create an SQL file that
  - creates and initializes (where applicable) the database
  - setup for backend access only (no row level security in supabase)
  - create as new schema "partydropper" in an existing supabase project
- create the actual database on supabase

3. create the nextjs backend api and connect it to the supabase tables

4. create the main display screen
- show the current photo
- poll the backend for playlist updates
- integrate playlist updates in the current state

5. add the ticker 
- create a ticker row component that scrolls through a list of comments
- create a ticker component with two rows 

6. add the action page
- implement the QR display and refresh/update mechanism

7. implement photo upload
- create a photo upload page
- first it shows an upload button (and a cancel button)
- once uploaded it shows a preview plus the extracted metadata and ok, cancel buttons
- closing this dialog with ok adds the photo (plus optional comment) to the playlist

8. implement commenting on the event
- create a comment page (useable for both photo and event comments)
- it has ok, cancel buttons
- closing this dialog with ok adds the comment to the appropriate playlist

9. implement 



