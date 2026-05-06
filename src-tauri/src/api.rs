use std::{fs::{self, OpenOptions}, io::Read, path::{Path, PathBuf}};

use serde_json::Value;
use tauri::{AppHandle, Runtime, Window};

use crate::{args::{run, ExportArgs, IcecBuilderArgs, PackageBuilderArgs, PackerArgs, ServerArgs, SysminArgs, ThemeArgs}, message::{Package, Payload, ServerPackage, SysminLists}};

const SYSMIN_CONFIG_DIR: &str = "sysmin";
const ICECAP_LIST_FILE: &str = "icecap-list.json";
const PORTFOLIO_LIST_FILE: &str = "portfolio-list.json";
const PORTFOLIO_BOOT_FILE: &str = "portfolio-boot.json";
const ICECAP_LIST_RESOURCE: &str = "resources/sysmin/icecap-list.json";
const PORTFOLIO_LIST_RESOURCE: &str = "resources/sysmin/portfolio-list.json";
const PORTFOLIO_BOOT_RESOURCE: &str = "resources/sysmin/portfolio-boot.json";

fn get_sysmin_directory() -> Result<PathBuf, String> {
	let config_dir = dirs::config_dir()
		.ok_or_else(|| String::from("Could not resolve a configuration directory for sysmin list files."))?;

	Ok(config_dir.join("devx").join(SYSMIN_CONFIG_DIR))
}

fn read_bundled_sysmin_file<R: Runtime>(app: &AppHandle<R>, resource: &str) -> Result<String, String> {
	let resource_path = app
		.path_resolver()
		.resolve_resource(resource)
		.ok_or_else(|| format!("Could not find bundled sysmin resource: {resource}"))?;

	fs::read_to_string(&resource_path)
		.map_err(|error| format!("Could not read bundled sysmin resource {}: {}", resource_path.display(), error))
}

fn ensure_sysmin_file<R: Runtime>(
	app: &AppHandle<R>,
	config_dir: &Path,
	file_name: &str,
	resource: &str
) -> Result<String, String> {
	let file_path = config_dir.join(file_name);

	if !file_path.exists() {
		let bundled_contents = read_bundled_sysmin_file(app, resource)?;
		fs::write(&file_path, &bundled_contents)
			.map_err(|error| format!("Could not create sysmin file {}: {}", file_path.display(), error))?;
		return Ok(bundled_contents);
	}

	fs::read_to_string(&file_path)
		.map_err(|error| format!("Could not read sysmin file {}: {}", file_path.display(), error))
}

fn parse_sysmin_entries(contents: &str, label: &str) -> Result<Vec<String>, String> {
	let values: Vec<String> = serde_json::from_str(contents)
		.map_err(|error| format!("Could not parse {} as a JSON string array: {}", label, error))?;

	Ok(values
		.into_iter()
		.map(|value| value.trim().to_string())
		.filter(|value| !value.is_empty())
		.collect())
}

fn entries_to_editor_text(contents: &str, label: &str) -> Result<String, String> {
	Ok(parse_sysmin_entries(contents, label)?.join("\n"))
}

fn editor_text_to_json(contents: &str) -> Result<String, String> {
	let entries: Vec<String> = contents
		.lines()
		.map(str::trim)
		.filter(|value| !value.is_empty())
		.map(String::from)
		.collect();

	serde_json::to_string_pretty(&entries)
		.map(|json| format!("{json}\n"))
		.map_err(|error| format!("Could not serialize sysmin entries to JSON: {}", error))
}

fn load_sysmin_lists<R: Runtime>(app: &AppHandle<R>) -> Result<SysminLists, String> {
	let config_dir = get_sysmin_directory()?;
	fs::create_dir_all(&config_dir)
		.map_err(|error| format!("Could not create sysmin config directory {}: {}", config_dir.display(), error))?;

	Ok(SysminLists {
		i_list: entries_to_editor_text(
			&ensure_sysmin_file(app, &config_dir, ICECAP_LIST_FILE, ICECAP_LIST_RESOURCE)?,
			ICECAP_LIST_FILE
		)?,
		p_list: entries_to_editor_text(
			&ensure_sysmin_file(app, &config_dir, PORTFOLIO_LIST_FILE, PORTFOLIO_LIST_RESOURCE)?,
			PORTFOLIO_LIST_FILE
		)?,
		p_boot: entries_to_editor_text(
			&ensure_sysmin_file(app, &config_dir, PORTFOLIO_BOOT_FILE, PORTFOLIO_BOOT_RESOURCE)?,
			PORTFOLIO_BOOT_FILE
		)?
	})
}

#[tauri::command]
pub async fn packer(
	window: Window,
	args: PackerArgs
) {

	let _ = run(args, &window).await;

}

#[tauri::command]
pub async fn get_packages(
	theme: String
) -> Vec<Package> {

	let path_result = shellexpand::full("$POPATH/../themes");

	let mut packages: Vec<Package> = vec![];

	if let Ok(theme_base) = path_result {

		let theme_base = theme_base.trim();

		let theme_base_path = PathBuf::from(theme_base);

		let theme_path = theme_base_path.join(theme);

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
	} 

	packages
}

#[tauri::command]
pub async fn get_themes(
) -> Vec<String> {

	let path_result = shellexpand::full("$POPATH/../themes");
	
	let mut themes: Vec<String> = vec![];

	if let Ok(theme_base) = path_result {

		let theme_base = theme_base.trim();

		let theme_base_path = PathBuf::from(theme_base);

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
	}
	
	themes
}

#[tauri::command]
pub async fn get_repoes(
	path: String
) -> Vec<Package> {

	let path_result = shellexpand::full(&path);

	let mut repo_list: Vec<Package> = vec![];

	if let Ok(git_base) = path_result {

		let git_base = git_base.trim();

		let git_base_path = PathBuf::from(git_base);

		

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
	}

	repo_list
}

#[tauri::command]
pub async fn exporter(
	window: Window,
	args: ExportArgs
) {

	let _ = run(args, &window).await;

}

#[tauri::command]
pub async fn builder(
	window: Window,
	args: IcecBuilderArgs
) {

	if args.build == "all" {

		let mut all_build = args.clone();

		all_build.build = String::from("all");

		let _ = run(all_build, &window).await;
	}
	else {
		let _ = run(args, &window).await;

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

	let _ = run(args, &window).await;


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
    let _ = run(args, &window).await;

    window.emit("sysmin-done", Payload {
        update: false,
        error: false,
        message: "Done".to_string()
    }).unwrap();
}

#[tauri::command]
pub async fn get_sysmin_lists<R: Runtime>(
	app: tauri::AppHandle<R>
) -> Result<SysminLists, String> {
	load_sysmin_lists(&app)
}

#[tauri::command]
pub async fn save_sysmin_lists<R: Runtime>(
	_app: tauri::AppHandle<R>,
	system: String,
	i_list: String,
	p_list: String,
	p_boot: String
) -> Result<(), String> {
	let config_dir = get_sysmin_directory()?;
	fs::create_dir_all(&config_dir)
		.map_err(|error| format!("Could not create sysmin config directory {}: {}", config_dir.display(), error))?;

	let targets = if system == "i" {
		vec![
			(ICECAP_LIST_FILE, editor_text_to_json(&i_list)?)
		]
	} else {
		vec![
			(PORTFOLIO_LIST_FILE, editor_text_to_json(&p_list)?),
			(PORTFOLIO_BOOT_FILE, editor_text_to_json(&p_boot)?)
		]
	};

	for (file_name, contents) in targets {
		let target_path = config_dir.join(file_name);
		fs::write(&target_path, contents)
			.map_err(|error| format!("Could not save sysmin file {}: {}", target_path.display(), error))?;
	}

	Ok(())
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

    let _ = run(args, &window).await;

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

	let result = run(args, &window).await;
	
	if result.is_ok() {
		window.emit("creator-done", Payload {
			update: false,
			error: false,
			message: "Done".to_string()
		}).unwrap();
	}
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
