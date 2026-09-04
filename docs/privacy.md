# Privacy

## Camera processing

Camera Studio uses the browser camera API and MediaPipe Hands. Camera frames are processed in the browser for the interactive visual experience.

The project does not include an application backend, database, account system, or camera-upload pipeline.

## Permission lifecycle

Camera access is requested only after the user starts Camera Studio. Stopping the studio stops the active media tracks and clears the rendering state.

## Third-party assets

MediaPipe browser assets are currently loaded from jsDelivr. This means the browser makes requests to that CDN when the tracker is initialized.

## Contact form

The contact form prepares a `mailto:` message in the user's email client. The website itself does not submit the inquiry to an application server.

## User responsibility

Only grant camera permission when you want to use Camera Studio. Review browser and device permissions if access is no longer required.
