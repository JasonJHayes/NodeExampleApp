"use strict";

// these constants are shared with the server side
Object.defineProperties(this.window || global, {
    // environment constants
    ENV_DEVELOPMENT: { value: "dev", writable: false },
    ENV_PRODUCTION: { value: "production", writable: false },
    MAX_REQUEST_BODY_SIZE: { value: Math.pow(2, 22), writable: false }, // just under 5MB (allow for base64 images)
    // cookie constants
    // must match client side constant
    COOKIE_SESSION: { value: "S", writable: false },
    COOKIE_MSG: { value: "M", writable: false },
    // path constants
    PUBLIC_URL: { value: "/public", writable: false }, // must match public.html base href
    SIGNIN_URL: { value: "/public/signin", writable: false },
    SECURE_URL: { value: "/secure", writable: false }, // must match secure.html base href
    // message constants
    MSG_NOT_FOUND: { value: "Sorry, the resource you request could not be found!", writable: false },
    MSG_UNAUTHORIZED: { value: "Unauthorized! Please sign in.", writable: false },
    MSG_404_ERROR: { value: "404 - File or directory not found.", writable: false },
    MSG_UNKNOWN_ERROR: { value: "Sorry, an unexpected error has occurred!", writable: false }
});