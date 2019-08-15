/*
 * @Description: Main process
 * @Author: Lin Heyang
 * @Date: 2019-08-10 21:38:21
 * @LastEditors: Lin Heyang
 * @LastEditTime: 2019-08-15 00:53:54
 */
const electron = require('electron')
const {app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray} = electron
const isDev = require('electron-is-dev')
  
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let [win, moreWin] = [null, null]  //初始化主窗口和“更多”窗口
  let [winPosition, moreWinPosition] = [[], []] //主窗口和“更多”窗口的左上角坐标
  let screenWidth  //屏幕的尺寸
  let tray = null  //初始化托盘

  //只允许打开一个实例，如果有一个实例存在，则第二个实例不会打开，聚焦到第一个实例。
  const gotTheLock = app.requestSingleInstanceLock()
  
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    })
  }

  function createWindow () {
    // 创建浏览器窗口。
    win = new BrowserWindow({
      width: 360,
      height: 460,
      frame: false,  //是否显示窗口边缘框架
      resizable: isDev,  //不可更改窗口尺寸
      maximizable: false, //不可最大化，防止用户双击使得最大化
      show: false,  //为了让初始化窗口显示无闪烁，先关闭显示，等待加载完成后再显示。
      title: 'chameleon',
      icon: 'lib/assets/img/icon/icon.png',
      nodeIntegration: false
    })

    win.once('ready-to-show', () => {
      win.show()
    })
  
    // 然后加载应用的 index.html。
    win.loadFile('index.html')
  
    // 打开开发者工具
    if (isDev) win.webContents.openDevTools()
  
    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
      // 取消引用 window 对象，如果你的应用支持多窗口的话，
      // 通常会把多个 window 对象存放在一个数组里面，
      // 与此同时，你应该删除相应的元素。
      win     = null
      moreWin = null
    })
  }

  function createMoreWindow () {
    // 创建浏览器窗口。
    moreWin = new BrowserWindow({
      parent: win,
      width: 380,
      height: 510,
      x: moreWinPosition[0],
      y: winPosition[1],
      frame: false,  //是否显示窗口边缘框架
      backgroundColor: '#fff',
      resizable: isDev,  //不可更改窗口尺寸
      maximizable: false, //不可最大化，防止用户双击使得最大化
      show: false  //为了让初始化窗口显示无闪烁，先关闭显示，等待加载完成后再显示。
    })

    moreWin.once('ready-to-show', () => {
      moreWin.show()
    })
  
    // 然后加载“更多”页面 more.html。
    moreWin.loadFile('lib/more.html')
  
     // 打开开发者工具
     if (isDev) moreWin.webContents.openDevTools()
  
    // 当 moreWindow 被关闭，这个事件会被触发。
    moreWin.on('close', () => { moreWin = null })
  }
  
  // Electron 会在初始化后并准备
  // 创建浏览器窗口时，调用这个函数。
  // 部分 API 在 ready 事件触发后才能使用。
  app.on('ready', () => {
    createWindow()
    
    //设置CSP HTTP头
    const { session } = require('electron')
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['default-src \'none\'']
        }
      })
    })
  })
  
  // 当全部窗口关闭时退出。
  app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
      createWindow()
    }
  })
  
  // 在这个文件中，你可以续写应用剩下主进程代码。
  // 也可以拆分成几个文件，然后用 require 导入。

  ipcMain.on('min', () => { win.minimize() })

  ipcMain.on('close', () => { win.close() })

  ipcMain.on('stick', function() {
    if (win.isAlwaysOnTop()) {
          win.setAlwaysOnTop(false);
    }else{
      win.setAlwaysOnTop(true);
    }
  })

  ipcMain.on('more', function() {
    if (moreWin) {
      moreWin.focus()
    } else {
      winPosition = win.getPosition()
      screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width
      if (winPosition[0]>(screenWidth-380-390)) {
        moreWinPosition[0] = winPosition[0]-400
      } else {
        moreWinPosition[0] = winPosition[0]+380
      }
      createMoreWindow()
    }
  })

  ipcMain.on('close-more', () => { moreWin.close() })