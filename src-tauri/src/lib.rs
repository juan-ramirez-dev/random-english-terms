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
    ];

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
