class MeetupBannerUploader < BaseUploader
  def store_dir
    "uploads/meetups/banners/#{model.id || 'pending'}"
  end

  def size_range
    1..8.megabytes
  end
end
