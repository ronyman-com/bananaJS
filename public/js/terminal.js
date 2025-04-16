// public/js/terminal.js
class TerminalManager {
  constructor(appState) {
    this.appState = appState;
    this.terminal = null;
    this.fitAddon = null;
    this.socket = null;
    this.commandHistory = [];
    this.historyIndex = 0;
    this.currentCommand = '';
    this.terminalSection = document.getElementById('terminal-section');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Initialize terminal
      this.terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1a1a1a',
          foreground: '#e0e0e0',
          cursor: '#ffffff'
        },
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        scrollback: 1000
      });

      // Load addons
      this.fitAddon = new FitAddon();
      this.terminal.loadAddon(this.fitAddon);
      this.terminal.loadAddon(new WebLinksAddon());

      // Open terminal in container
      const terminalEl = document.getElementById('terminal');
      if (!terminalEl) {
        throw new Error('Terminal element not found');
      }
      
      this.terminal.open(terminalEl);
      this.fitAddon.fit();

      // Connect to WebSocket
      await this.connectWebSocket();

      // Setup event listeners
      this.setupTerminalBehavior();
      this.setupButtonHandlers();

      // Show initial prompt
      this.terminal.writeln('Terminal initialized - Ready for commands');
      this.writePrompt();
      
      this.initialized = true;
      
    } catch (error) {
      console.error('Terminal initialization failed:', error);
      if (this.terminal) {
        this.terminal.writeln(`\r\nError: ${error.message}\r\n`);
      }
    }
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.socket = new WebSocket(`${protocol}//${window.location.host}/terminal`);

      this.socket.onopen = () => {
        this.terminal.writeln('\r\nConnected to terminal session');
        this.handleTerminalResize(); // Send initial size
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'terminal-output') {
            this.terminal.write(message.data);
          } else {
            this.terminal.write(event.data);
          }
        } catch {
          this.terminal.write(event.data);
        }
      };

      this.socket.onerror = (error) => {
        this.terminal.writeln(`\r\nConnection error: ${error.message}`);
        reject(error);
      };

      this.socket.onclose = () => {
        this.terminal.writeln('\r\nTerminal session disconnected');
      };
    });
  }

  setupTerminalBehavior() {
    // Handle terminal input
    this.terminal.onData((data) => {
      switch (data) {
        case '\r': // Enter
          this.handleCommandEnter();
          break;
        case '\u007F': // Backspace
          this.handleBackspace();
          break;
        case '\u001B[A': // Up arrow
          this.handleHistoryUp();
          break;
        case '\u001B[B': // Down arrow
          this.handleHistoryDown();
          break;
        case '\u001B[C': // Right arrow
          // Move cursor right if not at end
          break;
        case '\u001B[D': // Left arrow
          // Move cursor left if not at beginning
          break;
        case '\t': // Tab
          // Handle tab completion
          break;
        default:
          // Printable characters
          if (data >= String.fromCharCode(32) && data <= String.fromCharCode(126)) {
            this.currentCommand += data;
            this.terminal.write(data);
          }
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.fitAddon.fit();
      this.handleTerminalResize();
    });
  }

  setupButtonHandlers() {
    // Clear terminal button
    document.getElementById('clear-terminal')?.addEventListener('click', () => {
      this.terminal.clear();
      this.writePrompt();
    });

    // Run start button
    document.getElementById('run-start')?.addEventListener('click', () => {
      this.executeCommand('npm start');
    });

    // Send command button
    document.getElementById('send-command')?.addEventListener('click', () => {
      this.sendTerminalCommand();
    });

    // Input field enter key
    document.getElementById('terminal-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendTerminalCommand();
      }
    });
  }

  writePrompt() {
    this.terminal.write('\r\n$ ');
  }

  handleCommandEnter() {
    this.terminal.write('\r\n');
    const command = this.currentCommand.trim();
    
    if (command) {
      this.commandHistory.push(command);
      this.historyIndex = this.commandHistory.length;
      this.executeCommand(command);
    } else {
      this.writePrompt();
    }
    
    this.currentCommand = '';
  }

  executeCommand(command) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'command',
        command: command
      }));
    } else {
      this.terminal.writeln('Error: Not connected to terminal server');
      this.writePrompt();
    }
  }

  handleTerminalResize() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const { cols, rows } = this.terminal;
      this.socket.send(JSON.stringify({
        type: 'resize',
        cols,
        rows
      }));
    }
  }

  handleBackspace() {
    if (this.currentCommand.length > 0) {
      this.currentCommand = this.currentCommand.slice(0, -1);
      this.terminal.write('\b \b');
    }
  }

  handleHistoryUp() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentCommand = this.commandHistory[this.historyIndex];
      this.terminal.write('\x1b[2K\r$ ' + this.currentCommand);
    }
  }

  handleHistoryDown() {
    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      this.currentCommand = this.commandHistory[this.historyIndex];
      this.terminal.write('\x1b[2K\r$ ' + this.currentCommand);
    } else {
      this.historyIndex = this.commandHistory.length;
      this.currentCommand = '';
      this.terminal.write('\x1b[2K\r$ ');
    }
  }

  sendTerminalCommand() {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    
    const command = input.value.trim();
    if (command) {
      this.executeCommand(command);
      input.value = '';
    }
  }

  show() {
    this.terminalSection.classList.remove('hidden');
    this.fitAddon.fit();
  }

  hide() {
    this.terminalSection.classList.add('hidden');
  }
}

export { TerminalManager };