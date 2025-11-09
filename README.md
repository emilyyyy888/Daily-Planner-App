# ✨ Daily Planner - Schedule App

A cute, fresh, and minimalist task planning website to help you overcome procrastination and better plan your day!

## 🌟 Features

- **📝 Task Drafts Panel**: Record tasks you want to complete anytime
- **⏰ Time Planning**: Drag and drop tasks to specific time slots
- **🎨 Task Categories**: Different task types with different color identifiers
  - Work 💼
  - Study 📚
  - Exercise 🏃
  - Rest 😴
  - Other ✨
- **📅 Multiple View Support**:
  - **Day View**: Detailed planning for 24 hours a day
  - **Week View**: View the entire week's schedule
  - **Month View**: Overview of task distribution for the entire month
- **💾 Local Storage**: All data is automatically saved to browser local storage
- **🔄 Drag & Drop**: Intuitive drag-and-drop interface for task management
- **✏️ Task Editing**: Edit task details including name, type, start time, and duration
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Then open the displayed local address in your browser (usually `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 🌐 Free Deployment

### Deploy to Vercel (Recommended - Easiest)

1. **Push your code to GitHub** (if not already done)
2. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub
3. **Click "New Project"** and import your repository
4. **Vercel will auto-detect Vite** - just click "Deploy"
5. **Done!** Your site will be live in seconds

Your site will be available at: `https://your-project-name.vercel.app`

**Features:**

- ✅ Free forever
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ **Auto-deploy on every git push** - Just push to GitHub and Vercel updates automatically!
- ✅ Preview deployments for Pull Requests

### Other Deployment Options

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:

- Netlify deployment
- GitHub Pages
- Firebase setup for cloud storage
- Data persistence solutions

## 📖 Usage Instructions

1. **Add Tasks**: Enter task content in the left draft panel, select task type, and click the `+` button or press Enter to add
2. **Plan Time**: Drag tasks from the draft panel to the corresponding time slots on the right schedule
3. **Switch Views**: Click the "Day", "Week", or "Month" buttons at the top to switch between different views
4. **Navigate Dates**: Use the left and right arrow buttons at the top to switch dates
5. **Manage Tasks**:
   - **Edit Task**: Click the ✎ button on a task to edit its details
   - **Move to Draft**: Click the ↶ button on a scheduled task to move it back to drafts
   - **Delete Task**: Click the × button on a task to delete it
   - **Quick Add**: Click the ➜ button on draft tasks to quickly add them to the schedule at the next available time slot

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **@dnd-kit** - Drag and drop functionality
- **date-fns** - Date manipulation and formatting
- **CSS3** - Styling with modern features

## 💡 Design Philosophy

- **Cute & Fresh**: Soft pink color scheme creating a warm and comfortable atmosphere
- **Simple & Practical**: Clean interface focused on core functionality
- **User-Friendly Interaction**: Smooth drag-and-drop experience with intuitive operations

## 📁 Project Structure

```
schedule-app/
├── src/
│   ├── components/       # React components
│   │   ├── Header.jsx    # Navigation header
│   │   ├── DraftPanel.jsx # Task drafts panel
│   │   ├── DayView.jsx   # Day view component
│   │   ├── WeekView.jsx  # Week view component
│   │   ├── MonthView.jsx # Month view component
│   │   ├── TaskEditor.jsx # Task editing modal
│   │   ├── TaskItem.jsx  # Task item component
│   │   └── DatePicker.jsx # Date picker component
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json          # Dependencies
└── vite.config.js        # Vite configuration
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

MIT License

---

Hope this app helps you better plan your time and overcome procrastination! 💪✨
