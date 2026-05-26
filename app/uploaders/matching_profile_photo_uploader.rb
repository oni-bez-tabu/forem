class MatchingProfilePhotoUploader < BaseUploader
  def store_dir
    "uploads/matching_profiles/photos/#{model.id || 'pending'}"
  end

  def size_range
    1..8.megabytes
  end
end
