import { Desktop } from '@wxcc-desktop/sdk';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    .container {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      padding: 16px;
      border-radius: 8px;
      background-color: #f5f5f5;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .dark-mode {
      background-color: #2d2d2d;
      color: #f5f5f5;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .icon {
      font-size: 24px;
      margin-right: 12px;
    }
    
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .content {
      margin-bottom: 16px;
    }
    
    .status {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 10px;
    }
    
    .status-active {
      background-color: #44CC44;
    }
    
    .status-paused {
      background-color: #FFC107;
    }
    
    .status-inactive {
      background-color: #999999;
    }
    
    .status-text {
      font-size: 14px;
    }
    
    .link-container {
      margin-bottom: 16px;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      margin-bottom: 8px;
    }
    
    .dark-mode input {
      background-color: #444;
      color: #f5f5f5;
      border-color: #666;
    }
    
    button {
      background-color: #007AA3;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    button:hover {
      background-color: #005E7D;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .dark-mode button:disabled {
      background-color: #444444;
    }
    
    .button-container {
      display: flex;
      justify-content: space-between;
    }
    
    .logs {
      margin-top: 16px;
      max-height: 120px;
      overflow-y: auto;
      font-size: 12px;
      background-color: #ffffff;
      border-radius: 4px;
      padding: 8px;
      border: 1px solid #ddd;
    }
    
    .dark-mode .logs {
      background-color: #333333;
      border-color: #555555;
    }
    
    .log-entry {
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid #eee;
    }
    
    .dark-mode .log-entry {
      border-bottom: 1px solid #444;
    }
    
    .timestamp {
      color: #888;
      margin-right: 6px;
    }
    
    .dark-mode .timestamp {
      color: #aaa;
    }
    
    .success {
      color: #44CC44;
    }
    
    .error {
      color: #FF5252;
    }
    
    .info {
      color: #2196F3;
    }
    
    .dark-mode .success {
      color: #5CFF5C;
    }
    
    .dark-mode .error {
      color: #FF7575;
    }
    
    .dark-mode .info {
      color: #64B5F6;
    }
  </style>

  <div class="container">
    <div class="header">
      <span class="icon">🔒</span>
      <h2>Secure Recording Pause</h2>
    </div>
    
    <div class="content">
      <div class="status">
        <div class="status-indicator status-inactive" id="recording-status"></div>
        <span class="status-text" id="status-text">Waiting for active call...</span>
      </div>
      
      <div class="link-container">
        <label for="secure-link">Secure Link URL:</label>
        <input type="text" id="secure-link" placeholder="Enter URL (e.g., https://payment.example.com)" />
        <label for="link-description">Link Description:</label>
        <input type="text" id="link-description" placeholder="Enter description (e.g., Payment Portal)" />
      </div>
      
      <div class="button-container">
        <button id="open-link-button" disabled>Open Secure Link</button>
        <button id="manual-pause-button" disabled>Pause Recording</button>
        <button id="manual-resume-button" disabled>Resume Recording</button>
      </div>
    </div>
    
    <div class="logs" id="logs">
      <div class="log-entry">
        <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
        <span class="info">Widget initialized. Waiting for active call...</span>
      </div>
    </div>
  </div>
`;

// Creating a custom logger
const logger = Desktop.logger.createLogger('pause-resume-recording-widget');

class PauseResumeRecordingWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    // State
    this.state = {
      isRecording: false,
      isPaused: false,
      interactionId: null,
      secureLink: '',
      linkDescription: '',
      hasActiveCall: false,
      openedWindow: null
    };
    
    // For keeping track of window check interval
    this.windowCheckInterval = null;
    
    // Bind methods to ensure 'this' context
    this.openSecureLink = this.openSecureLink.bind(this);
    this.pauseRecording = this.pauseRecording.bind(this);
    this.resumeRecording = this.resumeRecording.bind(this);
  }

  connectedCallback() {
    this.init();
    this.addEventListeners();
    this.subscribeToContactEvents();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    Desktop.agentContact.removeAllEventListeners();
    
    // Clear all intervals and timeouts
    if (this.windowCheckInterval) {
      clearInterval(this.windowCheckInterval);
      this.windowCheckInterval = null;
    }
    
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
    
    // Try to resume recording if it was paused and widget is being removed
    if (this.state.isPaused && this.state.interactionId) {
      try {
        Desktop.agentContact.resumeRecording({
          interactionId: this.state.interactionId
        });
        logger.info('Resumed recording during widget disconnection');
      } catch (error) {
        logger.error('Failed to resume recording during disconnection:', error);
      }
    }
  }

  addEventListeners() {
    // Button event listeners
    this.shadowRoot.getElementById('open-link-button').addEventListener('click', () => this.openSecureLink());
    this.shadowRoot.getElementById('manual-pause-button').addEventListener('click', () => this.pauseRecording());
    this.shadowRoot.getElementById('manual-resume-button').addEventListener('click', () => this.resumeRecording());
    
    // Input event listeners for updating state
    this.shadowRoot.getElementById('secure-link').addEventListener('input', (e) => {
      this.state.secureLink = e.target.value;
      this.updateButtonStates();
    });
    
    this.shadowRoot.getElementById('link-description').addEventListener('input', (e) => {
      this.state.linkDescription = e.target.value;
      this.updateButtonStates();
    });
  }

  removeEventListeners() {
    this.shadowRoot.getElementById('open-link-button').removeEventListener('click', () => this.openSecureLink());
    this.shadowRoot.getElementById('manual-pause-button').removeEventListener('click', () => this.pauseRecording());
    this.shadowRoot.getElementById('manual-resume-button').removeEventListener('click', () => this.resumeRecording());
  }

  init() {
    // Initiate desktop config
    Desktop.config.init();
    this.logMessage('Widget initialized');
  }

  async   subscribeToContactEvents() {
    // Subscribe to agent contact events
    Desktop.agentContact.addEventListener('eAgentContact', (msg) => {
      this.logMessage('Agent contact event received', 'info');
      this.state.hasActiveCall = true;
      this.state.interactionId = msg.data.interactionId;
      this.state.isRecording = true;
      this.state.isPaused = false;
      this.updateUI();
    });

    Desktop.agentContact.addEventListener('eAgentContactEnded', (msg) => {
      this.logMessage('Call ended', 'info');
      this.state.hasActiveCall = false;
      this.state.interactionId = null;
      this.state.isRecording = false;
      this.state.isPaused = false;
      this.updateUI();
      
      // Close the secure window if it's open
      if (this.state.openedWindow && !this.state.openedWindow.closed) {
        this.state.openedWindow.close();
        this.state.openedWindow = null;
      }
      
      // Clear any timeouts or intervals
      if (this.windowCheckInterval) {
        clearInterval(this.windowCheckInterval);
        this.windowCheckInterval = null;
      }
      
      if (this.resumeTimeout) {
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = null;
      }
    });

    Desktop.agentContact.addEventListener('eRecordingPaused', (msg) => {
      this.logMessage('Recording pause event received', 'success');
      this.state.isPaused = true;
      this.updateUI();
    });

    Desktop.agentContact.addEventListener('eRecordingResumed', (msg) => {
      this.logMessage('Recording resume event received', 'success');
      this.state.isPaused = false;
      this.updateUI();
    });

    // Check for current active tasks on initialization
    this.checkForActiveTasks();
    
    // Debug logging for all agent contact events
    const allEvents = [
      'eAgentContact', 'eAgentContactEnded', 'eAgentWrapup', 'eAgentContactEstablished',
      'eAgentContactHeld', 'eAgentContactUnHeld', 'eRecordingPaused', 'eRecordingResumed'
    ];
    
    allEvents.forEach(eventName => {
      Desktop.agentContact.addEventListener(eventName, (msg) => {
        logger.info(`Event received: ${eventName}`, msg);
      });
    });
  }

  async checkForActiveTasks() {
    try {
      const taskMap = await Desktop.actions.getTaskMap();
      if (taskMap && taskMap.size > 0) {
        for (const [key, task] of taskMap.entries()) {
          if (task.interactionId) {
            this.state.hasActiveCall = true;
            this.state.interactionId = task.interactionId;
            this.state.isRecording = true;
            this.logMessage(`Active call detected: ${task.interactionId}`, 'info');
            break;
          }
        }
      }
      this.updateUI();
    } catch (error) {
      this.logMessage(`Error checking active tasks: ${error.message}`, 'error');
    }
  }

  updateUI() {
    const statusIndicator = this.shadowRoot.getElementById('recording-status');
    const statusText = this.shadowRoot.getElementById('status-text');
    const openLinkButton = this.shadowRoot.getElementById('open-link-button');
    const manualPauseButton = this.shadowRoot.getElementById('manual-pause-button');
    const manualResumeButton = this.shadowRoot.getElementById('manual-resume-button');
    
    statusIndicator.classList.remove('status-active', 'status-paused', 'status-inactive');
    
    if (!this.state.hasActiveCall) {
      statusIndicator.classList.add('status-inactive');
      statusText.textContent = 'Waiting for active call...';
      openLinkButton.disabled = true;
      manualPauseButton.disabled = true;
      manualResumeButton.disabled = true;
      
      // Reset button styles
      manualResumeButton.style.backgroundColor = '';
      manualResumeButton.textContent = 'Resume Recording';
    } else if (this.state.isPaused) {
      statusIndicator.classList.add('status-paused');
      statusText.innerHTML = '<strong style="color: #FF5252">⚠️ Recording paused - Remember to resume when finished</strong>';
      openLinkButton.disabled = false;
      manualPauseButton.disabled = true;
      manualResumeButton.disabled = false;
      
      // Highlight the resume button
      manualResumeButton.style.backgroundColor = '#FF5252';
      manualResumeButton.textContent = 'RESUME RECORDING NOW';
      
      this.logMessage('UI updated: Recording is paused, resume button highlighted', 'info');
    } else {
      statusIndicator.classList.add('status-active');
      statusText.textContent = 'Recording active';
      openLinkButton.disabled = false;
      manualPauseButton.disabled = false;
      manualResumeButton.disabled = true;
      
      // Reset button styles
      manualResumeButton.style.backgroundColor = '';
      manualResumeButton.textContent = 'Resume Recording';
    }
    
    this.updateButtonStates();
  }

  updateButtonStates() {
    const openLinkButton = this.shadowRoot.getElementById('open-link-button');
    
    // Disable open link button if URL is empty
    if (!this.state.hasActiveCall || !this.state.secureLink) {
      openLinkButton.disabled = true;
    } else {
      openLinkButton.disabled = false;
    }
  }

  async pauseRecording() {
    if (!this.state.interactionId || this.state.isPaused) {
      this.logMessage("Cannot pause recording - no active call or already paused", "error");
      return Promise.resolve(null);
    }
    
    try {
      this.logMessage('Attempting to pause recording...', 'info');
      
      const response = await Desktop.agentContact.pauseRecording({
        interactionId: this.state.interactionId
      });
      
      this.logMessage('Recording paused successfully', 'success');
      
      // Update state manually in case the event doesn't fire
      this.state.isPaused = true;
      this.updateUI();
      
      return response;
    } catch (error) {
      this.logMessage(`Error pausing recording: ${error.message}`, 'error');
      return Promise.resolve(null);
    }
  }

  async resumeRecording() {
    if (!this.state.interactionId || !this.state.isPaused) {
      this.logMessage("Cannot resume recording - no active paused recording found", "error");
      return;
    }
    
    try {
      this.logMessage('Attempting to resume recording...', 'info');
      
      // Force a small delay before resuming to ensure the API call doesn't conflict with another operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Make the API call to resume recording
      const response = await Desktop.agentContact.resumeRecording({
        interactionId: this.state.interactionId
      });
      
      this.logMessage('Resume recording API call completed', 'success');
      
      // Manually update our state in case the event doesn't fire
      this.state.isPaused = false;
      this.updateUI();
      
      return response;
    } catch (error) {
      this.logMessage(`Error resuming recording: ${error.message}`, 'error');
      // Try one more time after a longer delay
      this.logMessage('Retrying resume recording after delay...', 'info');
      setTimeout(() => {
        try {
          Desktop.agentContact.resumeRecording({
            interactionId: this.state.interactionId
          });
          this.state.isPaused = false;
          this.updateUI();
        } catch (retryError) {
          this.logMessage(`Retry failed: ${retryError.message}`, 'error');
        }
      }, 2000);
    }
  }

  openSecureLink() {
    if (!this.state.secureLink) {
      this.logMessage('No secure link configured', 'error');
      return;
    }
    
    if (!this.state.interactionId) {
      this.logMessage('No active call to pause recording for', 'error');
      return;
    }
    
    try {
      // Pause recording before opening link
      this.pauseRecording().then(pauseResponse => {
        this.logMessage('Recording paused, opening secure link...', 'info');
        
        // Open the link in a new window
        const windowName = 'securePortal';
        const windowFeatures = 'width=1000,height=800,resizable=yes,scrollbars=yes,status=yes';
        this.state.openedWindow = window.open(this.state.secureLink, windowName, windowFeatures);
        
        if (!this.state.openedWindow) {
          this.logMessage('Failed to open window. Browser may have blocked pop-up.', 'error');
          // Resume recording if window didn't open
          this.resumeRecording();
          return;
        }
        
        this.logMessage(`Opened secure link: ${this.state.secureLink}`, 'info');
        
        // Set up manual resume button
        const resumeButton = this.shadowRoot.getElementById('manual-resume-button');
        resumeButton.style.backgroundColor = '#FF5252';
        resumeButton.textContent = 'RESUME RECORDING NOW';
        resumeButton.disabled = false;
        
        // Add warning text
        const statusText = this.shadowRoot.getElementById('status-text');
        statusText.innerHTML = '<strong style="color: #FF5252">⚠️ Recording paused - Remember to resume when finished</strong>';
        
        // Set up window close detection
        const checkWindow = () => {
          if (this.state.openedWindow && this.state.openedWindow.closed) {
            clearInterval(this.windowCheckInterval);
            this.logMessage('Secure window closed - attempting to resume recording', 'info');
            
            // Only auto-resume if still paused
            if (this.state.isPaused) {
              this.resumeRecording();
            }
          }
        };
        
        // Check every 1 second if the window is closed
        this.windowCheckInterval = setInterval(checkWindow, 1000);
        
        // Also listen for focus events on parent window
        const focusHandler = () => {
          // Only check when parent window gets focus
          if (this.state.openedWindow && this.state.openedWindow.closed && this.state.isPaused) {
            this.logMessage('Focus returned to agent desktop and secure window closed', 'info');
            clearInterval(this.windowCheckInterval);
            window.removeEventListener('focus', focusHandler);
            this.resumeRecording();
          }
        };
        
        window.addEventListener('focus', focusHandler);
        
        // Add a backup timeout to resume recording after X minutes (failsafe)
        const maxPauseDuration = 10 * 60 * 1000; // 10 minutes
        this.resumeTimeout = setTimeout(() => {
          if (this.state.isPaused) {
            this.logMessage('Maximum pause duration reached - automatically resuming recording', 'info');
            this.resumeRecording();
          }
        }, maxPauseDuration);
      });
    } catch (error) {
      this.logMessage(`Error in secure link process: ${error.message}`, 'error');
      // Ensure recording resumes if there was an error
      if (this.state.isPaused) {
        this.resumeRecording();
      }
    }
  }

  logMessage(message, type = 'info') {
    // Create log entry
    const logContainer = this.shadowRoot.getElementById('logs');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = type;
    messageSpan.textContent = message;
    
    logEntry.appendChild(timestamp);
    logEntry.appendChild(messageSpan);
    
    // Add to log container
    logContainer.appendChild(logEntry);
    
    // Auto scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Log to console as well
    switch (type) {
      case 'error':
        logger.error(message);
        break;
      case 'success':
        logger.info(`SUCCESS: ${message}`);
        break;
      default:
        logger.info(message);
    }
  }

  // Handle dark mode
  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === 'darkmode') {
      const container = this.shadowRoot.querySelector('.container');
      if (newVal === 'true') {
        container.classList.add('dark-mode');
      } else {
        container.classList.remove('dark-mode');
      }
    }
  }

  static get observedAttributes() {
    return ['darkmode'];
  }
}

customElements.define('pause-resume-recording-widget', PauseResumeRecordingWidget);
