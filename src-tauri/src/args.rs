use std::{fs::OpenOptions, io::{BufRead, BufReader, Read, Write}, net::ToSocketAddrs, os::windows::process::CommandExt, path::PathBuf, process::{Command, Stdio}, sync::Mutex, time};
use serde::{Deserialize, Serialize};
use sysinfo::{Pid, System};
use tauri::{Manager, Window};
use zip::read::root_dir_common_filter;

use crate::message::Payload;

pub trait Handler {
	fn run(&self, window: &Window) -> impl std::future::Future<Output = Result<(), bool>> + Send;
}


pub struct AppState {
	pub children: Mutex<Vec<u32>>
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PackerArgs {
	pub theme: String,
	pub packages: String,
	pub host: String,
	pub user: String, 
	pub password: String,
	pub icebreak: String,
	pub ifs: String,
	pub zip: bool,
	pub clean: bool,
	pub export: bool,
	pub build: bool,
	pub update: bool
}

impl Handler for PackerArgs {
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let app = window.app_handle();

		let path = app
		.path_resolver()
		.resolve_resource("bin")
		.expect("Could not find directory");

		let cmd_path = path.join("theme-executor.exe");
		
		let mut cmd = Command::new(cmd_path);
	
		cmd.arg("-t")
			.arg(&self.theme);

		if self.zip {
			cmd.arg("-z");
		}

		if self.clean {
			cmd.arg("-c");
		}

		if self.build {
			cmd.arg("-b");
		}

		if self.update {
			cmd.arg("-U");
		}

		if !self.packages.is_empty() {
			cmd.arg("--package")
				.arg(&self.packages);
		}

		if self.export {

			cmd.arg("-e")
				.arg("-h")
				.arg(&self.host)
				.arg("-u")
				.arg(&self.user)
				.arg("-w")
				.arg(&self.password);
		}

		if !self.icebreak.is_empty() {
			cmd.arg("-i")
				.arg(&self.icebreak);
			
			if !self.ifs.is_empty() {
				cmd.arg("-f")
					.arg(&self.ifs);
			}
		}

		cmd.stdout(Stdio::piped());
		cmd.stderr(Stdio::piped());
		cmd.creation_flags(0x08000000);

		let mut child = cmd.spawn().unwrap();

		let stdout = child.stdout.take().unwrap();
		
		let mut out_reader = BufReader::new(stdout);

		let mut vec_buf = [0; 1024];

		let mut last = "".to_string();
		let mut update = false;

		while let Ok(bytes) = out_reader.read(&mut vec_buf) {
					
			if bytes == 0 {
				break;
			}
			else {

				let slice = &vec_buf[..bytes];
				let org_str = std::str::from_utf8(slice).unwrap().to_string();

				let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

				if out_buffer.contains('\r') {
					let temp: Vec<&str> = out_buffer.split('\r').collect();
					out_buffer = temp.first().unwrap().to_string();
				}

				let first_temp: Vec<u8> = vec![27];
				let first_str = String::from_utf8(first_temp).unwrap();

				out_buffer = out_buffer.replace(&first_str, "");

				let second_temp: Vec<u8> = vec![91, 49, 65];
				let second_str = String::from_utf8(second_temp).unwrap();

				out_buffer = out_buffer.replace(&second_str, "");

				let last_temp: Vec<u8> = vec![91, 74];
				let last_str = String::from_utf8(last_temp).unwrap();

				out_buffer = out_buffer.replace(&last_str, "");

				if org_str.contains(&first_str) ||
					org_str.contains(&second_str) ||
					org_str.contains(&last_str) {

					let a_lines: Vec<&str> = out_buffer.split('\n').collect();

					out_buffer = a_lines.first().unwrap().to_string();

					if !out_buffer.is_empty() {
						out_buffer += "\n";
					}
				}
				else if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
					out_buffer += "\n";
				}
				
				if !out_buffer.is_empty() && out_buffer != last {
		
					std::thread::sleep(time::Duration::from_millis(10));

					let payload = Payload {
						update,
						error: false,
						message: out_buffer.clone()
					};

					update = false;

					window.emit("theme-status", payload).unwrap();

					last.clone_from(&out_buffer);				
				}
				else if !out_buffer.is_empty() && out_buffer.ends_with('\n') {
					update = true;
				}

				vec_buf = [0; 1024];
			}
		}

		let stderr = child.stderr.take().unwrap();
		
		let mut err_reader = BufReader::new(stderr);
		let mut err_buffer = String::new();

		while let Ok(bytes) = err_reader.read_line(&mut err_buffer) {

			if bytes == 0 {
				break;
			}
			else {
				std::thread::sleep(time::Duration::from_millis(10));

				let payload = Payload {
					update: false,
					error: true,
					message: err_buffer.clone()
				};

				window.emit("theme-error", payload).unwrap();

				err_buffer.clear();
			}
		}

		std::thread::sleep(time::Duration::from_millis(10));

		window.emit("theme-done", Payload {
			update: false,
			error: false,
			message: "Done".to_string()
		}).unwrap();

		let _ = child.wait();

		Ok(())
	}
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ExportArgs {
	pub host: String,
	pub user: String,
	pub password: String,
	pub destination: String,
	pub branch: String,
	pub export: bool,
	pub create: bool,
	pub dist: bool,
	pub pack: bool,
	pub repo: String,
	pub path: String,
	pub ftp: bool
}

impl Handler for ExportArgs {
	
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let app = window.app_handle();

		let path = app
		.path_resolver()
		.resolve_resource("bin")
		.expect("Could not find directory");

		let cmd_path = path.join("repo-executor.exe");

		let mut cmd = Command::new(cmd_path);

		let mut repo_path = PathBuf::from(shellexpand::full(&self.path).unwrap().to_string());

		repo_path.push(&self.repo);

		let path = repo_path.to_string_lossy().to_string();
		
		if !&self.repo.is_empty() {

				if self.export {
					cmd.arg("-l")
					.arg(path);

					cmd.arg("-h")
					.arg(&self.host)
					.arg("-u")
					.arg(&self.user)
					.arg("-w")
					.arg(&self.password)
					.arg("-d")
					.arg(&self.destination)
					.arg("-s");
					
					if self.ftp {
						cmd.arg("-f");
					}
				
					if self.create {
						cmd.arg("-c");
					}

					if self.dist {
						cmd.arg("--dist");
					}
			
					if !&self.branch.is_empty() {
						cmd.arg("-b")
							.arg(&self.branch);
					}
				}
				else if self.pack {

					let package_json = repo_path.clone().join("package.json");

					if !package_json.exists() {

						window.emit("exporter-done", Payload {
							update: false,
							error: true,
							message: "No package.json found for npm pack".to_string()
						}).unwrap();

						return Err(false);
					}
			
					if cfg!(target_os = "windows") {
			
						cmd = Command::new("bash.exe")
					} else {
						cmd = Command::new("sh")
					};
					
					cmd.args(["-c", "npm pack"]);
					cmd.current_dir(path);
				}

				cmd.stdout(Stdio::piped());
				cmd.stderr(Stdio::piped());

				if cfg!(target_os = "windows") {
					cmd.creation_flags(0x08000000);
				}

				let mut child = cmd.spawn().unwrap();
			
				let stdout = child.stdout.take().unwrap();
				
				let mut out_reader = BufReader::new(stdout);
			
				let mut vec_buf = [0; 1024];
			
				let mut last = "".to_string();
				let mut update = false;
			
				while let Ok(bytes) = out_reader.read(&mut vec_buf) {
					
					if bytes == 0 {
						break;
					}
					else {

						let slice = &vec_buf[..bytes];
			
						let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();
			
						if out_buffer.contains('\r') {
							let temp: Vec<&str> = out_buffer.split('\r').collect();
							out_buffer = temp.first().unwrap().to_string();
						}

						let first_temp: Vec<u8> = vec![27];
						let first_str = String::from_utf8(first_temp).unwrap();

						out_buffer = out_buffer.replace(&first_str, "");

						let second_temp: Vec<u8> = vec![91, 51, 65];
						let second_str = String::from_utf8(second_temp).unwrap();

						out_buffer = out_buffer.replace(&second_str, "");

						let last_temp: Vec<u8> = vec![91, 74];
						let last_str = String::from_utf8(last_temp).unwrap();

						out_buffer = out_buffer.replace(&last_str, "");

						if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
							out_buffer += "\n";
						}
						
						if !out_buffer.is_empty() && out_buffer != last {
				
							std::thread::sleep(time::Duration::from_millis(10));
			
							let payload = Payload {
								update,
								error: false,
								message: out_buffer.clone()
							};
			
							update = false;
			
							window.emit("exporter-status", payload).unwrap();
			
							last.clone_from(&out_buffer);				
						}
						else if out_buffer != "\n" {
								update = true;
						}
			
						vec_buf = [0; 1024];
					}
				}
			
				let stderr = child.stderr.take().unwrap();
				
				let mut err_reader = BufReader::new(stderr);
				let mut err_buffer = String::new();
			
				while let Ok(bytes) = err_reader.read_line(&mut err_buffer) {
			
					if bytes == 0 {
						break;
					}
					else {
						std::thread::sleep(time::Duration::from_millis(10));
			
						let payload = Payload {
							update: false,
							error: true,
							message: err_buffer.clone()
						};
			
						window.emit("exporter-error", payload).unwrap();
			
						err_buffer.clear();
					}
				}
			
				std::thread::sleep(time::Duration::from_millis(10));
			
				window.emit("exporter-done", Payload {
					update: false,
					error: false,
					message: "Done".to_string()
				}).unwrap();

				let _ = child.wait();
		}
		else {

			window.emit("exporter-error", Payload {
				update: false,
				error: true,
				message: "Need to chose a repo to export".to_string()
			}).unwrap();
		}

		Ok(())
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IcecBuilderArgs {
	pub host: String,
	pub user: String,
	pub password: String,
	pub ifs: String,
	pub build: String,
	pub deploy: String,
	pub bin: String,
	pub build_icecap: bool,
	pub build_portfolio: bool,
	pub release: bool,
	pub target: String
}

impl Handler for IcecBuilderArgs {
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let app = window.app_handle();

		let path = app
		.path_resolver()
		.resolve_resource("bin")
		.expect("Could not find directory");

		let cmd_path = path.join("icebuilder.exe");
		
		let mut cmd = Command::new(cmd_path);

		cmd
		.arg("-h")
		.arg(&self.host)
		.arg("-u")
		.arg(&self.user)
		.arg("-w")
		.arg(&self.password)
		.arg("-i")
		.arg(&self.ifs)
		.arg("-t")
		.arg(&self.build)
		.arg("-b")
		.arg(&self.bin)
		.arg("-d")
		.arg(&self.deploy)
		.arg("--target")
		.arg(&self.target);

		if self.release {
			cmd.arg("-r");
		}

		cmd.stdout(Stdio::piped());

		if cfg!(target_os = "windows") {
			cmd.creation_flags(0x08000000);
		}

		let mut child = cmd.spawn().unwrap();
	
		let stdout = child.stdout.take().unwrap();
		
		let mut out_reader = BufReader::new(stdout);
	
		let mut vec_buf = [0; 1024];
	
		let mut last = "".to_string();
		let mut update = false;
	
		loop {

			let result = out_reader.read(&mut vec_buf);

			if let Ok(bytes) = result {

				if bytes == 0 {
					break;
				}
	
				if bytes > 0 {
	
					let slice = &vec_buf[..bytes];
		
					let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();
	
					if out_buffer.contains('\r') {
						let temp: Vec<&str> = out_buffer.split('\r').collect();
						out_buffer = temp.first().unwrap().to_string();
					}
	
					let first_temp: Vec<u8> = vec![27];
					let first_str = String::from_utf8(first_temp).unwrap();
	
					out_buffer = out_buffer.replace(&first_str, "");
	
					let second_temp: Vec<u8> = vec![91, 50, 65];
					let second_str = String::from_utf8(second_temp).unwrap();
	
					out_buffer = out_buffer.replace(&second_str, "");
	
					let last_temp: Vec<u8> = vec![91, 74];
					let last_str = String::from_utf8(last_temp).unwrap();
	
					out_buffer = out_buffer.replace(&last_str, "");
	
					if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
						out_buffer += "\n";
					}
					
					if !out_buffer.is_empty() && out_buffer != last {
			
						std::thread::sleep(time::Duration::from_millis(10));
	
						let payload = Payload {
							update,
							error: false,
							message: out_buffer.clone()
						};
	
						update = false;
	
						window.emit("icebuilder-status", payload).unwrap();
	
						last.clone_from(&out_buffer);				
					}
					else if out_buffer != "\n" {
							update = true;
					}
	
					vec_buf = [0; 1024];
				}
			}
			else {

				let error = result.err().unwrap();

				let payload = Payload {
					update,
					error: false,
					message: format!("Error: {error}")
				};

				update = false;

				window.emit("icebuilder-status", payload).unwrap();
			}
		}

		let _ = child.wait();

		Ok(())
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageBuilderArgs {
	pub host: String,
	pub user: String,
	pub password: String,
	pub ifs: String,
	pub build: String,
	pub deploy: String,
	pub bin: String,
	pub build_icecap: bool,
	pub build_portfolio: bool
}

impl Handler for PackageBuilderArgs {
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let app = window.app_handle();

		let path = app
		.path_resolver()
		.resolve_resource("bin")
		.expect("Could not find directory");

		let cmd_path = path.join("icebuilder.exe");
		
		let mut cmd = Command::new(cmd_path);

		cmd
		.arg("-h")
		.arg(&self.host)
		.arg("-u")
		.arg(&self.user)
		.arg("-w")
		.arg(&self.password);

		if self.build_icecap {
			cmd.arg("--build-icecap");
		}
		else if self.build_portfolio {
			cmd.arg("--build-portfolio");
		}

		if cfg!(target_os = "windows") {
			cmd.creation_flags(0x08000000);
		}

		cmd.stdout(Stdio::piped());
		cmd.stderr(Stdio::piped());

		let mut child = cmd.spawn().unwrap();
	
		let stdout = child.stdout.take().unwrap();
		let stderr = child.stderr.take().unwrap();
		
		let mut out_reader = BufReader::new(stdout);
		let mut err_reader = BufReader::new(stderr);
	
		let mut vec_buf = [0; 1024];
	
		let mut last = "".to_string();
		let mut update = false;
	
		loop {

			let bytes = out_reader.read(&mut vec_buf).unwrap_or(0);
			
			if bytes == 0 {
				break;
			}

			if bytes > 0 {

				let slice = &vec_buf[..bytes];
	
				let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

				if out_buffer.contains('\r') {
					let temp: Vec<&str> = out_buffer.split('\r').collect();
					out_buffer = temp.first().unwrap().to_string();
				}

				let first_temp: Vec<u8> = vec![27];
				let first_str = String::from_utf8(first_temp).unwrap();

				out_buffer = out_buffer.replace(&first_str, "");

				let second_temp: Vec<u8> = vec![91, 50, 65];
				let second_str = String::from_utf8(second_temp).unwrap();

				out_buffer = out_buffer.replace(&second_str, "");

				let last_temp: Vec<u8> = vec![91, 74];
				let last_str = String::from_utf8(last_temp).unwrap();

				out_buffer = out_buffer.replace(&last_str, "");

				if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
					out_buffer += "\n";
				}
				
				if !out_buffer.is_empty() && out_buffer != last {
		
					std::thread::sleep(time::Duration::from_millis(10));

					let payload = Payload {
						update,
						error: false,
						message: out_buffer.clone()
					};

					update = false;

					window.emit("icebuilder-status", payload).unwrap();

					last.clone_from(&out_buffer);				
				}
				else if out_buffer != "\n" {
						update = true;
				}

				vec_buf = [0; 1024];
			}
		}
		
		vec_buf = [0; 1024];

		
		last = "".to_string();
		update = false;

		loop {

			let bytes = err_reader.read(&mut vec_buf).unwrap_or(0);
			
			if bytes == 0 {
				break;
			}

			if bytes > 0 {

				let slice = &vec_buf[..bytes];
	
				let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

				if out_buffer.contains('\r') {
					let temp: Vec<&str> = out_buffer.split('\r').collect();
					out_buffer = temp.first().unwrap().to_string();
				}

				let first_temp: Vec<u8> = vec![27];
				let first_str = String::from_utf8(first_temp).unwrap();

				out_buffer = out_buffer.replace(&first_str, "");

				let second_temp: Vec<u8> = vec![91, 50, 65];
				let second_str = String::from_utf8(second_temp).unwrap();

				out_buffer = out_buffer.replace(&second_str, "");

				let last_temp: Vec<u8> = vec![91, 74];
				let last_str = String::from_utf8(last_temp).unwrap();

				out_buffer = out_buffer.replace(&last_str, "");

				if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
					out_buffer += "\n";
				}
				
				if !out_buffer.is_empty() && out_buffer != last {
		
					std::thread::sleep(time::Duration::from_millis(10));

					let payload = Payload {
						update,
						error: false,
						message: out_buffer.clone()
					};

					update = false;

					window.emit("icebuilder-status", payload).unwrap();

					last.clone_from(&out_buffer);				
				}
				else if out_buffer != "\n" {
						update = true;
				}

				vec_buf = [0; 1024];
			}
		}

		let _ = child.wait();

		Ok(())
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeArgs {
	pub path: String,
	pub name: String,
	pub project: String,
	pub extends: Vec<String>,
	pub create: bool
}

impl Handler for ThemeArgs {
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let theme_base = shellexpand::full(&self.path).unwrap();

		let theme_path = PathBuf::from(theme_base.to_string());

		if self.create {

			let local_data_path = dirs::data_local_dir().unwrap();

			let devx_path = local_data_path.join("devx");

			let ext_file_path = devx_path.join("ext-6.6.0.zip");

			let ext_folder_path = devx_path.join("ext-6.6.0");

			if !&ext_file_path.exists() {

				if devx_path.exists() {
					std::fs::remove_dir_all(&devx_path).unwrap();
				}
				
				std::fs::create_dir(&devx_path).unwrap();

				let payload = Payload {
					update: false,
					error: false,
					message: "Downloading ext-6.6.0\n".to_string()
				};

				window.emit("creator-status", payload).unwrap();

				let address: Vec<_> = "webfiles.system-method.com:21".to_socket_addrs().unwrap().collect();

				let mut ftp_stream = ftp::FtpStream::connect(address.get(0).unwrap()).unwrap();

				let login_result = ftp_stream.login("system-method.com", "2Fast4you");

				if login_result.is_ok() {

					ftp_stream.transfer_type(ftp::types::FileType::Binary).unwrap();

					let payload = Payload {
						update: false,
						error: false,
						message: "Downloading: 0%\n".to_string()
					};

					window.emit("creator-status", payload).unwrap();
					
					let server_file = "/webfiles/download/Tools/ext-6.6.0.zip";

					let size = ftp_stream.size(server_file).unwrap().unwrap();
					let ftp_error = Mutex::new(false);

					let _ = ftp_stream.retr(server_file, |stream| {

						let mut file = OpenOptions::new().create(true).write(true).truncate(true).open(&ext_file_path).unwrap();
						
						let mut buffer = [0; 8192];
						let mut currunt = 0;

						loop {

							let read_result = stream.read(&mut buffer[..]);

							if let Ok(read_size) = read_result {

								currunt += read_size;

								let procentage = ((currunt as f64 / size as f64) * 100.0) as i32;

								if read_size == 0 {
									break;
								}
								else {
									
									let write_result = file.write_all(&buffer[..read_size]);

									if write_result.is_err() {

										let error = write_result.err().unwrap();

										let payload = Payload {
											update: true,
											error: false,
											message: format!("Write Error: {error}\n").to_string()
										};
										
										window.emit("creator-error", payload).unwrap();
										
										*ftp_error.lock().unwrap() = true;

										break;
									}

								}

								let payload = Payload {
									update: true,
									error: false,
									message: format!("Downloading: {procentage}%\n").to_string()
								};
								
								window.emit("creator-status", payload).unwrap();

								std::thread::sleep(time::Duration::from_millis(10));
							}
							else {
								let error = read_result.err().unwrap();

								let payload = Payload {
									update: true,
									error: false,
									message: format!("Write Error: {error}\n").to_string()
								};
								
								window.emit("creator-error", payload).unwrap();
							}
						}

						Ok(())
					});

					if *ftp_error.lock().unwrap() {
						return Err(false);
					}

					let payload = Payload {
						update: false,
						error: false,
						message: "Donwloading complete\n".to_string()
					};

					window.emit("creator-status", payload).unwrap();

				}
				else {

					let error = login_result.err().unwrap();
					
					let payload = Payload {
						update:  false,
						error: false,
						message: format!("Error: {error}\n")
					};

					window.emit("creator-error", payload).unwrap();

					return  Err(false);
				}

				ftp_stream.quit().unwrap();
				
				let payload = Payload {
					update: false,
					error: false,
					message: "Unzipping ext-6.6.0\n".to_string()
				};

				window.emit("creator-status", payload).unwrap();

				let mut archive = zip::ZipArchive::new(
					std::fs::File::open(&ext_file_path).unwrap()
				).unwrap();
				
				let unzip_result = archive.extract_unwrapped_root_dir(&ext_folder_path, root_dir_common_filter);

				if unzip_result.is_ok() {

					let payload = Payload {
						update: false,
						error: false,
						message: "Unzipping complete\n".to_string()
					};

					window.emit("creator-status", payload).unwrap();
				}
				else {
					let error = unzip_result.err().unwrap();

					let payload = Payload {
						update: false,
						error: true,
						message: format!("Extraction error: {error}\n").to_string()
					};

					window.emit("creator-error", payload).unwrap();

					return Err(false);
				}
			}
			else {

				if !ext_folder_path.exists() {

					let payload = Payload {
						update: false,
						error: false,
						message: "Unzipping ext-6.6.0\n".to_string()
					};

					window.emit("creator-status", payload).unwrap();

					let mut archive = zip::ZipArchive::new(
						std::fs::File::open(&ext_file_path).unwrap()
					).unwrap();
					
					let unzip_result = archive.extract_unwrapped_root_dir(&ext_folder_path, root_dir_common_filter);

					if unzip_result.is_ok() {

						let payload = Payload {
							update: false,
							error: false,
							message: "Unzipping complete\n".to_string()
						};

						window.emit("creator-status", payload).unwrap();
					}
					else {
						let error = unzip_result.err().unwrap();

						let payload = Payload {
							update: false,
							error: true,
							message: format!("Extraction error: {error}\n").to_string()
						};

						window.emit("creator-error", payload).unwrap();

						return Err(false);
					}
				}
			}

			let mut str_ext_path = ext_folder_path.to_string_lossy().to_string();
			str_ext_path = str_ext_path.replace("\\\\?", "");

			let project_path = theme_path.clone().join(&self.name);

			let mut str_project_path = project_path.to_string_lossy().to_string();
			str_project_path = str_project_path.replace("\\\\?", "");

			let mut cmd = Command::new("sencha.exe");
			cmd.arg("-sdk");
			cmd.arg(&str_ext_path);
			cmd.arg("generate");
			cmd.arg("app");
			cmd.arg("-classic");
			cmd.arg(&self.name);
			cmd.arg(&str_project_path);

			if cfg!(target_os = "windows") {
				cmd.creation_flags(0x08000000);
			}

			cmd.stdout(Stdio::piped());
			cmd.stderr(Stdio::piped());

			let spawn_result = cmd.spawn();

			if let Ok(mut child) = spawn_result {
				let stdout = child.stdout.take().unwrap();
				let stderr = child.stderr.take().unwrap();
				
				let mut out_reader = BufReader::new(stdout);
				let mut err_reader = BufReader::new(stderr);
			
				let mut vec_buf = [0; 1024];
			
				let mut last = "".to_string();
				let mut update = false;
			
				loop {

					let bytes = out_reader.read(&mut vec_buf).unwrap_or(0);
					
					if bytes == 0 {
						break;
					}

					if bytes > 0 {

						let slice = &vec_buf[..bytes];
			
						let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

						if out_buffer.contains('\r') {
							let temp: Vec<&str> = out_buffer.split('\r').collect();
							out_buffer = temp.first().unwrap().to_string();
						}

						let first_temp: Vec<u8> = vec![27];
						let first_str = String::from_utf8(first_temp).unwrap();

						out_buffer = out_buffer.replace(&first_str, "");

						let second_temp: Vec<u8> = vec![91, 50, 65];
						let second_str = String::from_utf8(second_temp).unwrap();

						out_buffer = out_buffer.replace(&second_str, "");

						let last_temp: Vec<u8> = vec![91, 74];
						let last_str = String::from_utf8(last_temp).unwrap();

						out_buffer = out_buffer.replace(&last_str, "");

						if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
							out_buffer += "\n";
						}
						
						if !out_buffer.is_empty() && out_buffer != last {
				
							std::thread::sleep(time::Duration::from_millis(10));

							let payload = Payload {
								update,
								error: false,
								message: out_buffer.clone()
							};

							update = false;

							window.emit("creator-status", payload).unwrap();

							last = out_buffer;				
						}
						else if out_buffer != "\n" {
								update = true;
						}

						vec_buf = [0; 1024];
					}
				}
				
				vec_buf = [0; 1024];

				
				last = "".to_string();
				update = false;

				loop {

					let bytes = err_reader.read(&mut vec_buf).unwrap_or(0);
					
					if bytes == 0 {
						break;
					}

					if bytes > 0 {

						let slice = &vec_buf[..bytes];
			
						let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

						if out_buffer.contains('\r') {
							let temp: Vec<&str> = out_buffer.split('\r').collect();
							out_buffer = temp.first().unwrap().to_string();
						}

						let first_temp: Vec<u8> = vec![27];
						let first_str = String::from_utf8(first_temp).unwrap();

						out_buffer = out_buffer.replace(&first_str, "");

						let second_temp: Vec<u8> = vec![91, 50, 65];
						let second_str = String::from_utf8(second_temp).unwrap();

						out_buffer = out_buffer.replace(&second_str, "");

						let last_temp: Vec<u8> = vec![91, 74];
						let last_str = String::from_utf8(last_temp).unwrap();

						out_buffer = out_buffer.replace(&last_str, "");

						if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
							out_buffer += "\n";
						}
						
						if !out_buffer.is_empty() && out_buffer != last {
				
							std::thread::sleep(time::Duration::from_millis(10));

							let payload = Payload {
								update,
								error: false,
								message: out_buffer.clone()
							};

							update = false;

							window.emit("creator-status", payload).unwrap();

							last = out_buffer;				
						}
						else if out_buffer != "\n" {
								update = true;
						}

						vec_buf = [0; 1024];
					}
				}

				let _ = child.wait();
			}
			else {
				let error = spawn_result.err().unwrap();

				let payload = Payload {
					update:  false,
					error: false,
					message: format!("Error: {error}\n")
				};

				window.emit("creator-error", payload).unwrap();

				return  Err(false);
			}
		}
		else {
			let project_path = theme_path.clone().join(&self.project);

			for extend in self.extends.iter() {

				let mut parts: Vec<String> = extend
				.split("-")
				.map(|value| {
					value.to_string()
				})
				.collect::<Vec<String>>();

				if parts.len() > 1 {
					let _ = parts.remove(0);
					parts.insert(0, self.name.clone());
				}

				let theme = parts.join("-");

				let mut cmd = Command::new("sencha.exe");

				cmd.arg("generate");
				cmd.arg("theme");
				cmd.arg("--extend");
				cmd.arg(extend);
				cmd.arg(&theme);

				cmd.current_dir(&project_path);

				if cfg!(target_os = "windows") {
					cmd.creation_flags(0x08000000);
				}

				cmd.stdout(Stdio::piped());
				cmd.stderr(Stdio::piped());

				let mut child = cmd.spawn().unwrap();
			
				let stdout = child.stdout.take().unwrap();
				let stderr = child.stderr.take().unwrap();
				
				let mut out_reader = BufReader::new(stdout);
				let mut err_reader = BufReader::new(stderr);
			
				let mut vec_buf = [0; 1024];
			
				let mut last = "".to_string();
				let mut update = false;
			
				loop {

					let bytes = out_reader.read(&mut vec_buf).unwrap_or(0);
					
					if bytes == 0 {
						break;
					}

					if bytes > 0 {

						let slice = &vec_buf[..bytes];
			
						let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

						if out_buffer.contains('\r') {
							let temp: Vec<&str> = out_buffer.split('\r').collect();
							out_buffer = temp.first().unwrap().to_string();
						}

						let first_temp: Vec<u8> = vec![27];
						let first_str = String::from_utf8(first_temp).unwrap();

						out_buffer = out_buffer.replace(&first_str, "");

						let second_temp: Vec<u8> = vec![91, 50, 65];
						let second_str = String::from_utf8(second_temp).unwrap();

						out_buffer = out_buffer.replace(&second_str, "");

						let last_temp: Vec<u8> = vec![91, 74];
						let last_str = String::from_utf8(last_temp).unwrap();

						out_buffer = out_buffer.replace(&last_str, "");

						if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
							out_buffer += "\n";
						}
						
						if !out_buffer.is_empty() && out_buffer != last {
				
							std::thread::sleep(time::Duration::from_millis(10));

							let payload = Payload {
								update,
								error: false,
								message: out_buffer.clone()
							};

							update = false;

							window.emit("creator-status", payload).unwrap();

							last = out_buffer;				
						}
						else if out_buffer != "\n" {
								update = true;
						}

						vec_buf = [0; 1024];
					}
				}
				
				vec_buf = [0; 1024];

				
				last = "".to_string();
				update = false;

				loop {

					let bytes = err_reader.read(&mut vec_buf).unwrap_or(0);
					
					if bytes == 0 {
						break;
					}

					if bytes > 0 {

						let slice = &vec_buf[..bytes];
			
						let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

						if out_buffer.contains('\r') {
							let temp: Vec<&str> = out_buffer.split('\r').collect();
							out_buffer = temp.first().unwrap().to_string();
						}

						let first_temp: Vec<u8> = vec![27];
						let first_str = String::from_utf8(first_temp).unwrap();

						out_buffer = out_buffer.replace(&first_str, "");

						let second_temp: Vec<u8> = vec![91, 50, 65];
						let second_str = String::from_utf8(second_temp).unwrap();

						out_buffer = out_buffer.replace(&second_str, "");

						let last_temp: Vec<u8> = vec![91, 74];
						let last_str = String::from_utf8(last_temp).unwrap();

						out_buffer = out_buffer.replace(&last_str, "");

						if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
							out_buffer += "\n";
						}
						
						if !out_buffer.is_empty() && out_buffer != last {
				
							std::thread::sleep(time::Duration::from_millis(10));

							let payload = Payload {
								update,
								error: false,
								message: out_buffer.clone()
							};

							update = false;

							window.emit("creator-status", payload).unwrap();

							last = out_buffer;				
						}
						else if out_buffer != "\n" {
								update = true;
						}

						vec_buf = [0; 1024];
					}
				}

				let _ = child.wait();
			}
		}

		Ok(())
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SysminArgs {
	pub system: String
}

impl Handler for SysminArgs {
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let app = window.app_handle();

		let path = app
		.path_resolver()
		.resolve_resource("bin")
		.expect("Could not find directory");

		let cmd_path = path.join("sysmin.exe");
		
		let mut cmd = Command::new(cmd_path);

		if self.system == "i" {
			cmd.arg("-i");
		}
		else if self.system == "p" {
			cmd.arg("-p");
		}

		if cfg!(target_os = "windows") {
			cmd.creation_flags(0x08000000);
		}

		cmd.stdout(Stdio::piped());
		cmd.stderr(Stdio::piped());

		let mut child = cmd.spawn().unwrap();
	
		let stdout = child.stdout.take().unwrap();
		let stderr = child.stderr.take().unwrap();
		
		let mut out_reader = BufReader::new(stdout);
		let mut err_reader = BufReader::new(stderr);
	
		let mut vec_buf = [0; 1024];
	
		let mut last = "".to_string();
		let mut update = false;
	
		loop {

			let bytes = out_reader.read(&mut vec_buf).unwrap_or(0);
			
			if bytes == 0 {
				break;
			}

			if bytes > 0 {

				let slice = &vec_buf[..bytes];
	
				let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

				if out_buffer.contains('\r') {
					let temp: Vec<&str> = out_buffer.split('\r').collect();
					out_buffer = temp.first().unwrap().to_string();
				}

				let first_temp: Vec<u8> = vec![27];
				let first_str = String::from_utf8(first_temp).unwrap();

				out_buffer = out_buffer.replace(&first_str, "");

				let second_temp: Vec<u8> = vec![91, 50, 65];
				let second_str = String::from_utf8(second_temp).unwrap();

				out_buffer = out_buffer.replace(&second_str, "");

				let last_temp: Vec<u8> = vec![91, 74];
				let last_str = String::from_utf8(last_temp).unwrap();

				out_buffer = out_buffer.replace(&last_str, "");

				if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
					out_buffer += "\n";
				}
				
				if !out_buffer.is_empty() && out_buffer != last {
		
					std::thread::sleep(time::Duration::from_millis(10));

					let payload = Payload {
						update,
						error: false,
						message: out_buffer.clone()
					};

					update = false;

					window.emit("sysmin-status", payload).unwrap();

					last.clone_from(&out_buffer);				
				}
				else if out_buffer != "\n" {
						update = true;
				}

				vec_buf = [0; 1024];
			}
		}
		
		vec_buf = [0; 1024];

		
		last = "".to_string();
		update = false;

		loop {

			let bytes = err_reader.read(&mut vec_buf).unwrap_or(0);
			
			if bytes == 0 {
				break;
			}

			if bytes > 0 {

				let slice = &vec_buf[..bytes];
	
				let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();

				if out_buffer.contains('\r') {
					let temp: Vec<&str> = out_buffer.split('\r').collect();
					out_buffer = temp.first().unwrap().to_string();
				}

				let first_temp: Vec<u8> = vec![27];
				let first_str = String::from_utf8(first_temp).unwrap();

				out_buffer = out_buffer.replace(&first_str, "");

				let second_temp: Vec<u8> = vec![91, 50, 65];
				let second_str = String::from_utf8(second_temp).unwrap();

				out_buffer = out_buffer.replace(&second_str, "");

				let last_temp: Vec<u8> = vec![91, 74];
				let last_str = String::from_utf8(last_temp).unwrap();

				out_buffer = out_buffer.replace(&last_str, "");

				if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
					out_buffer += "\n";
				}
				
				if !out_buffer.is_empty() && out_buffer != last {
		
					std::thread::sleep(time::Duration::from_millis(10));

					let payload = Payload {
						update,
						error: false,
						message: out_buffer.clone()
					};

					update = false;

					window.emit("sysmin-status", payload).unwrap();

					last.clone_from(&out_buffer);				
				}
				else if out_buffer != "\n" {
						update = true;
				}

				vec_buf = [0; 1024];
			}
		}

		let _ = child.try_wait();

		Ok(())
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerArgs {
	pub path: String,
	pub server: String,
	pub config: String,
	pub port: i32,
	pub https: bool,
	pub cache: bool
}

impl Handler for ServerArgs {
	async fn run(&self, window: &Window) -> Result<(), bool> {

		let server_base = shellexpand::full(&self.path.clone()).unwrap().to_string();

		let server_base = server_base.trim();

		let mut server_base_path = PathBuf::from(server_base);

		server_base_path.push(&self.server);

		let server = self.server.clone();
		let config = self.config.clone();
		let port = self.port;
		let https = self.https;	
		let cache = self.cache;
		
		let app = window.app_handle();

		let path = app
		.path_resolver()
		.resolve_resource("bin")
		.expect("Could not find directory");

		std::thread::spawn(move || {

			let cmd_path = path.join("goserver.exe");
		
			let mut cmd = Command::new(cmd_path);

			cmd
				.arg("-f")
				.arg(&server_base_path)
				.arg("-s")
				.arg(&config);

			if cfg!(target_os = "windows") {
				cmd.creation_flags(0x08000000);
			}
			if cache {
				cmd.arg("-a");
			} 

			cmd.stdout(Stdio::piped());
			cmd.stderr(Stdio::piped());

			let mut child = cmd.spawn().unwrap();
			let pid = child.id();
			let label = format!("server-{}", &pid);

			let url = if https {
				format!("https://localhost: {port}")
			} else {
				format!("http://localhost: {port}")
			};

			let w = tauri::WindowBuilder::new(
				&app,
				&label,
				tauri::WindowUrl::App("servers/server.html".parse().unwrap())
			)
			.title(format!("Server: {server}-{config} at: {url}"))
			.inner_size(1024., 800.0)
			.build().unwrap();

		
			let stdout = child.stdout.take().unwrap();
			let stderr = child.stderr.take().unwrap();
			
			let mut out_reader = BufReader::new(stdout);
			let mut err_reader = BufReader::new(stderr);
		
			let mut vec_buf = [0; 1024];
		
			let mut last = "".to_string();
			let mut update = false;	

			w.on_window_event(move |event| {
				
				if let tauri::WindowEvent::Destroyed = event {
	
					let sys = System::new_all();
					
					if let Some(process) = sys.process(Pid::from(pid as usize)) {
						if !process.kill() {
							println!("Could not kill the process {}", pid);
						}
					}
				}
			});
			
			loop {

				let bytes = out_reader.read(&mut vec_buf).unwrap_or(0);
				
				if bytes == 0 {
					break;
				}
	
				if bytes > 0 {
	
					let slice = &vec_buf[..bytes];
		
					let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();
	
					if out_buffer.contains('\r') {
						let temp: Vec<&str> = out_buffer.split('\r').collect();
						out_buffer = temp.first().unwrap().to_string();
					}
	
					let first_temp: Vec<u8> = vec![27];
					let first_str = String::from_utf8(first_temp).unwrap();
	
					out_buffer = out_buffer.replace(&first_str, "");
	
					let second_temp: Vec<u8> = vec![91, 50, 65];
					let second_str = String::from_utf8(second_temp).unwrap();
	
					out_buffer = out_buffer.replace(&second_str, "");
	
					let last_temp: Vec<u8> = vec![91, 74];
					let last_str = String::from_utf8(last_temp).unwrap();
	
					out_buffer = out_buffer.replace(&last_str, "");
	
					if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
						out_buffer += "\n";
					}
					
					if !out_buffer.is_empty() && out_buffer != last {
			
						std::thread::sleep(time::Duration::from_millis(10));
	
						let payload = Payload {
							update,
							error: false,
							message: out_buffer.clone()
						};
	
						update = false;
	
						w.emit("server-status", payload).unwrap();
	
						last.clone_from(&out_buffer);				
					}
					else if out_buffer != "\n" {
							update = true;
					}
	
					vec_buf = [0; 1024];
				}
			}
			
			vec_buf = [0; 1024];
	
			
			last = "".to_string();
			update = false;
	
			loop {
	
				let bytes = err_reader.read(&mut vec_buf).unwrap_or(0);
				
				if bytes == 0 {
					break;
				}
	
				if bytes > 0 {
	
					let slice = &vec_buf[..bytes];
		
					let mut out_buffer = std::str::from_utf8(slice).unwrap().to_string();
	
					if out_buffer.contains('\r') {
						let temp: Vec<&str> = out_buffer.split('\r').collect();
						out_buffer = temp.first().unwrap().to_string();
					}
	
					let first_temp: Vec<u8> = vec![27];
					let first_str = String::from_utf8(first_temp).unwrap();
	
					out_buffer = out_buffer.replace(&first_str, "");
	
					let second_temp: Vec<u8> = vec![91, 50, 65];
					let second_str = String::from_utf8(second_temp).unwrap();
	
					out_buffer = out_buffer.replace(&second_str, "");
	
					let last_temp: Vec<u8> = vec![91, 74];
					let last_str = String::from_utf8(last_temp).unwrap();
	
					out_buffer = out_buffer.replace(&last_str, "");
	
					if !out_buffer.is_empty() && !out_buffer.ends_with('\n') {
						out_buffer += "\n";
					}
					
					if !out_buffer.is_empty() && out_buffer != last {
			
						std::thread::sleep(time::Duration::from_millis(10));
	
						let payload = Payload {
							update,
							error: false,
							message: out_buffer.clone()
						};
	
						update = false;
	
						w.emit("server-error", payload).unwrap();
	
						last.clone_from(&out_buffer);				
					}
					else if out_buffer != "\n" {
							update = true;
					}
	
					vec_buf = [0; 1024];
				}
			}

			let _ = child.try_wait();
		});

		Ok(())
	}
}

pub async fn run<T>(args: T, window: &Window) -> Result<(), bool>
where T: Handler{
	args.run(window).await
}