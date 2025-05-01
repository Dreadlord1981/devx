#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use devx::api::*;

fn main() {
    tauri::Builder::default()
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
