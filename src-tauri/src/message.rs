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