# Pause Resume Recording Widget for WebEx Contact Center

![image](https://github.com/user-attachments/assets/1d3b7669-c0eb-45a2-916c-5b2a60042fda)

![image](https://github.com/user-attachments/assets/78027112-f076-41aa-b2bb-9d8ead5285b3)

![image](https://github.com/user-attachments/assets/5ccadf7d-9576-4562-95de-d41bd2187335)

A custom widget for WebEx Contact Center (WxCC) that allows agents to pause and resume call recordings when handling sensitive customer information, such as payment details or personal identifiers.

## Features

- **Manual Recording Controls**: Simple, focused buttons for pausing and resuming call recordings
- **Visual Indicators**: Clear visual feedback on recording status
- **Security Link Integration**: Ability to pause recording when opening secure external sites
- **Auto-Resume Support**: Multiple methods to ensure recordings are properly resumed
- **Dark Mode Compatible**: Seamless integration with WxCC's dark mode theme

## Getting Started

### Prerequisites

- Node.js and npm installed
- Access to WebEx Contact Center Admin Portal
- Ability to upload and configure Desktop Layouts

### Installation

1. Clone or download this repository
2. Navigate to the project directory and install dependencies:

```bash
cd pause-resume-widget
npm install
```

3. Build the widget bundle:

```bash
npm run build
```

4. Host the generated `bundle.js` file from the `build` directory on a web server accessible to your WxCC environment

### Configuring the Widget in WxCC

1. Log in to the WebEx Contact Center Management Portal
2. Navigate to Desktop Layout
3. Download your current layout
4. Add the widget configuration to your layout JSON. For example:

```json
{
  "comp": "pause-resume-recording-widget",
  "script": "https://your-server.example.com/widgets/bundle.js",
  "wrapper": {
    "title": "Secure Recording Control",
    "maximizeAreaName": "app-maximize-area"
  },
  "attributes": {
    "darkmode": "$STORE.app.darkMode"
  },
  "properties": {
    "accessToken": "$STORE.auth.accessToken"
  }
}
```

5. Upload and publish the updated layout

## Usage Guide

### Basic Operation

- **Pause Recording**: Click the "Pause Recording" button when you need to collect sensitive information
- **Resume Recording**: Click the "RESUME RECORDING NOW" button (highlighted in red) when you've finished collecting sensitive information
- **Status Indicator**: 
  - Green: Recording is active
  - Yellow: Recording is paused
  - Gray: No active call

### Security Link Feature

When configured, the widget can:
1. Pause recording when opening a secure link (e.g., payment portal)
2. Automatically attempt to resume recording when the window is closed
3. Provide a failsafe manual resume button when needed

## Development

### Project Structure

```
pause-resume-widget/
├── src/
│   └── pause-resume-recording-widget.js
├── package.json
├── webpack.config.js
└── build/
    └── bundle.js (generated)
```

### Available NPM Scripts

- `npm run build` - Build the widget bundle for production
- `npm run dev` - Build with watch mode for development
- `npm start` - Start a local server for testing

### Customization Options

You can customize the widget by modifying:
- Visual styling in the CSS section
- Button text and behavior
- Timeout durations for auto-resume
- Status indicators and colors

## Troubleshooting

### Common Issues

1. **Recording Not Resuming Automatically**:
   - Ensure pop-ups are allowed in your browser
   - Use the manual "RESUME RECORDING NOW" button 
   - Check browser console for any errors

2. **Widget Not Loading**:
   - Verify the script URL is correct and accessible
   - Check browser console for script loading errors
   - Confirm your Desktop Layout JSON is properly formatted

3. **Pause/Resume Not Working**:
   - Verify the agent has appropriate permissions
   - Check if recording is enabled for the call
   - Look for any API errors in the browser console

### Debug Mode

For troubleshooting, you can enable additional logging by adding debug parameters:

```json
"properties": {
  "accessToken": "$STORE.auth.accessToken",
  "debug": true
}
```

## Technical Details

This widget uses the WebEx Contact Center Desktop SDK to interact with the contact center platform:

- `Desktop.agentContact.pauseRecording()` - Pauses the current call recording
- `Desktop.agentContact.resumeRecording()` - Resumes the current call recording
- `Desktop.actions.getTaskMap()` - Retrieves information about active calls
- Event listeners for various agent state changes

## Security Considerations

- The widget only controls recording status; it does not access or modify call data
- When using the security link feature, be aware of potential pop-up blockers
- The 10-minute auto-resume safety timeout ensures recordings don't remain paused indefinitely

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- WebEx Contact Center Desktop SDK documentation
- WebEx Contact Center development community
