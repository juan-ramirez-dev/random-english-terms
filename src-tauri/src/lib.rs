mod ai;
mod error;
mod models;

use std::time::Duration;

use tauri_plugin_sql::{Migration, MigrationKind};

// Same URL as src/lib/local-db/db.ts. Migrations run when it opens.
const DB_URL: &str = "sqlite:lexio.db";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "preferences",
            sql: include_str!("../migrations/0002_preferences.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "ai_choice",
            sql: include_str!("../migrations/0003_ai_choice.sql"),
            kind: MigrationKind::Up,
        },
    ];

    // No global timeout: downloading a model takes a while. Only a connect timeout.
    let http = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .build()
        .expect("could not build the HTTP client");

    let mut builder = tauri::Builder::default();

    // The updater isn't available on mobile targets.
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_process::init())
            .plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(DB_URL, migrations)
                .build(),
        )
        .manage(http)
        .invoke_handler(tauri::generate_handler![
            models::models_status,
            models::model_download,
            models::model_delete,
            ai::ai_save_key,
            ai::ai_delete_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
