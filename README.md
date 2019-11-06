# Vulky
![Vulky is rendering the Cerberus revolver.](https://user-images.githubusercontent.com/18394014/68080611-78ff5d00-fdff-11e9-9077-632b2aceb000.png)
## Controls
- Left mouse button plus movement = camera control
- Right mouse button plus movement = Position object up/down and left/right.
- D = Rotate through display modes (GRAPHICS_PIPELINE_TYPE_FILL, GRAPHICS_PIPELINE_TYPE_WIREFRAME, GRAPHICS_PIPELINE_TYPE_POINT).
- C = Change cull-mode (GRAPHICS_PIPELINE_TYPE_NONE_CULL, GRAPHICS_PIPELINE_TYPE_FRONT_CULL, GRAPHICS_PIPELINE_TYPE_BACK_CULL).
- R = Set everything (camera orientation, display mode and cull-mode) back to default values.
- Escape key = Exit the application.
## Requirements
- Windows 10 (Version 1903) – only tested with that version
- Installed [Vulkan SDK](https://www.lunarg.com/vulkan-sdk/)
- All dependencies are already included.
- No include pathes / other pathes have to be adjusted because macros are used there. This only applies if you are using [Visual Studio](https://visualstudio.microsoft.com/vs/) ([Community](https://visualstudio.microsoft.com/vs/community/) is completely sufficient). While it's certainly possible to get it working with another IDE, with Visual Studio it will be the easiest, since the renderer was created with it.
