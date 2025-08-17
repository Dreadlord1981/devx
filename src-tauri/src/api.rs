use std::{fs::{self, OpenOptions}, io::Read, path::PathBuf};

use serde_json::Value;
use tauri::{Runtime, Window};

use crate::{args::{run, ExportArgs, IcecBuilderArgs, PackageBuilderArgs, PackerArgs, ServerArgs, SysminArgs, ThemeArgs}, message::{Package, Payload, ServerPackage}};

#[tauri::command]
pub async fn packer(
	window: Window,
	args: PackerArgs
) {

	run(args, &window);
}

#[tauri::command]
pub async fn get_packages(
	theme: String
) -> Vec<Package> {

	let theme_base = shellexpand::full("$POPATH/../themes").unwrap();

	let theme_base = theme_base.trim();

	let theme_base_path = PathBuf::from(theme_base);

	let theme_path = theme_base_path.join(theme);

	let mut packages: Vec<Package> = vec![];

	if theme_path.exists() {

		let package_path = PathBuf::from(String::from("packages/local"));

		let local_path = theme_path.join(package_path);

		let dir_entries = fs::read_dir(local_path);

		if let Ok(result_list) = dir_entries {

			for entry in result_list.flatten() {

				let meta = entry.metadata().unwrap();

				if meta.is_dir() {

					let name = entry.file_name();

					packages.push(Package{
						name: name.to_string_lossy().to_string()
					});
				}
			}
		}
	}

	packages
}

#[tauri::command]
pub async fn get_themes(
) -> Vec<String> {

	let theme_base = shellexpand::full("$POPATH/../themes").unwrap();

	let theme_base = theme_base.trim();

	let theme_base_path = PathBuf::from(theme_base);

	let mut themes: Vec<String> = vec![];

	let dir_entries = fs::read_dir(theme_base_path);

	if let Ok(result_list) = dir_entries {

		for entry in result_list.flatten() {

			let meta = entry.metadata().unwrap();

			if meta.is_dir() {

				let name = entry.file_name();

				themes.push(name.to_string_lossy().to_string());
			}
		}
	}

	themes
}

#[tauri::command]
pub async fn get_repoes(
	path: String
) -> Vec<Package> {

	let git_base = shellexpand::full(&path).unwrap().to_string();

	let git_base = git_base.trim();

	let git_base_path = PathBuf::from(git_base);

	let mut repo_list: Vec<Package> = vec![];

	let fs_result = fs::read_dir(git_base);

	if let Ok(result_list) = fs_result {

		for dir_entry in result_list.flatten() {

			let meta_data = dir_entry.metadata().unwrap();

			if meta_data.is_dir() {

				let mut git_dir = git_base_path.clone();
				git_dir.push(dir_entry.file_name());
				git_dir.push(".git");

				if git_dir.exists() {

					repo_list.push(Package{
						name: dir_entry.file_name().to_string_lossy().to_string()
					});
				}
			}
		}
	}
	
	repo_list.sort();

	repo_list
}

#[tauri::command]
pub async fn exporter(
	window: Window,
	args: ExportArgs
) {

	run(args, &window);
}

#[tauri::command]
pub async fn builder(
	window: Window,
	args: IcecBuilderArgs
) {

	if args.build == "all" {

		let mut all_build = args.clone();

		all_build.build = String::from("all");

		run(all_build, &window);
	}
	else {
		run(args, &window);
	}

	window.emit("icebuilder-done", Payload {
		update: false,
		error: false,
		message: "Done".to_string()
	}).unwrap();
}

#[tauri::command]
pub async fn package(
	window: Window,
	args: PackageBuilderArgs
) {

	run(args, &window);

	window.emit("icebuilder-done", Payload {
		update: false,
		error: false,
		message: "Done".to_string()
	}).unwrap();
}

#[tauri::command]
pub async fn sysmin(
    window: Window,
    args: SysminArgs
) {
    run(args, &window);
    window.emit("sysmin-done", Payload {
        update: false,
        error: false,
        message: "Done".to_string()
    }).unwrap();
}

#[tauri::command]
pub async fn run_server(
    window: Window,
    args: ServerArgs
) {
	let server = args.server.clone();
	let server_config = args.config.clone();
	let server_port =  args.port;
	let server_https =args.https;
	
	let url = if server_https {
		format!("https://localhost:{server_port}")
	} else {
		format!("http://localhost:{server_port}")
	};

    run(args, &window);
    window.emit("server-done", Payload {
        update: false,
        error: false,
        message: format!("Server started: {server} - {server_config} at: {url}\n")
    }).unwrap();
}

#[tauri::command]
pub async fn create_theme(
	window: Window,
	args: ThemeArgs
) {

	run(args, &window);

	window.emit("creator-done", Payload {
		update: false,
		error: false,
		message: "Done".to_string()
	}).unwrap();
}

#[tauri::command]
pub async fn update_title<R: Runtime> (
	_app: tauri::AppHandle<R>, 
	window: tauri::Window<R>,
	title: String
) -> Result<(), String> {
	window.set_title(&title).unwrap();
  Ok(())
}

#[tauri::command]
pub async fn get_server_list(
	path: String
) -> Vec<Package> {

	let server_base = shellexpand::full(&path).unwrap().to_string();

	let server_base = server_base.trim();

	let server_base_path = PathBuf::from(server_base);

	let mut server_list: Vec<Package> = vec![];

	let fs_result = fs::read_dir(server_base);

	if let Ok(result_list) = fs_result {

		for dir_entry in result_list.flatten() {

			let meta_data = dir_entry.metadata().unwrap();

			if meta_data.is_dir() {

				let mut server_dir = server_base_path.clone();
				server_dir.push(dir_entry.file_name());
				server_dir.push("go.json");

				if server_dir.exists() {

					server_list.push(Package{
						name: dir_entry.file_name().to_string_lossy().to_string()
					});
				}
			}
		}
	}
	
	server_list.sort();

	server_list
}

#[tauri::command]
pub async fn get_server_configs(
	path: String,
	server: String
) -> Vec<ServerPackage> {

	let server_base = shellexpand::full(&path).unwrap().to_string();

	let server_base = server_base.trim();

	let mut server_base_path = PathBuf::from(server_base);

	server_base_path.push(server);

	server_base_path.push("go.json");

	let mut server_list: Vec<ServerPackage> = vec![];

	if server_base_path.exists() {

		let mut data = String::from("");
		let mut file = OpenOptions::new().read(true).open(server_base_path).unwrap();
		file.read_to_string(&mut data).unwrap();

		let value: Value = serde_json::from_str(&data).unwrap();
		let list: Vec<Value> = serde_json::from_value(value["servers"].clone()).unwrap();

		for server in list.iter() {

			let name_value = &server["name"];
			let mut name = name_value.to_string();
			name = name.replace('"', "");

			let port_value = &server["port"];
			let mut port_str = port_value.to_string();
			port_str = port_str.replace('"', "");

			let port = port_str.parse::<i32>().unwrap();

			let https_value = &server["https"];

			let mut https = false;

			if let Some(val) = https_value.as_bool() {
				https = val;
			}

			server_list.push(ServerPackage{
				name,
				port,
				https
			});
		}

	}
	
	server_list.sort();

	server_list
}