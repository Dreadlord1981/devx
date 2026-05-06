use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Payload {
	pub update: bool,
	pub error: bool,
	pub message: String
}

#[derive(Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
pub struct Package {
	pub name: String
}

#[derive(Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
pub struct ServerPackage {
	pub name: String,
	pub port: i32,
	pub https: bool
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SysminLists {
	pub i_list: String,
	pub p_list: String,
	pub p_boot: String
}
