-- Network v8: cor personalizada da tag (owner escolhe a cor da propria tag / das tags dos usuarios)
alter table network_profiles add column if not exists tag_color text;
