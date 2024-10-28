use std::{path::PathBuf, fs};

use tauri::{Runtime, Window};

use crate::{args::{run, ExportArgs, IcecBuilderArgs, PackageBuilderArgs, PackerArgs, ThemeArgs}, message::{Package, Payload}};

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

		let mut service_build = args.clone();
		let mut release_build = args.clone();

		service_build.build = String::from("service");
		release_build.build = String::from("release");

		run(service_build, &window);
		run(release_build, &window);
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