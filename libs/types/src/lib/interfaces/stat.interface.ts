export interface Stat {
    total_users: number;
    active_users: number;
    total_labbook: number;
    total_notes: number;
    total_files: number;
    total_pics: number;
    image_folder_size: number;
    files_folder_size: number;
    git_commit_hash: string | null;
    git_commit_msg: string | null;
}
