#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use std::sync::Mutex;

use devx::{api::*, args::AppState};
use sysinfo::{Pid, System};
use tauri::Manager;

fn main() {
    tauri::Builder::default()
		.setup(|app| {

			let state = AppState {
				children: Mutex::new(vec![])
			};

			app.manage(state);

			Ok(())
		})
		.on_window_event(|event| {

			if let tauri::WindowEvent::Destroyed = event.event() {

				let win = event.window();
				let app =  win.app_handle();
				let state = app.state::<AppState>();

				let mut list = state.children.lock().unwrap();

				let sys = System::new_all();
				
				for pid in list.iter_mut() {

					if let Some(process) = sys.process(Pid::from(*pid as usize)) {
						if !process.kill() {
							println!("Could not kill the process {}", pid);
						}
					}
				}

				list.clear();
			}
		})
		.invoke_handler(
			tauri::generate_handler![
				packer, 
				exporter,
				get_packages,
				get_themes,
				get_repoes,
				update_title,
				builder,
				package,
				create_theme,
				sysmin,
				get_server_list,
				get_server_configs,
				run_server
			]
		)
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
