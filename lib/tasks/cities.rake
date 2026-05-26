namespace :cities do
  desc "Seed cities table from Geonames PL (population >= 5000) and add 'everywhere' special record. " \
       "Optionally pass FILE=/path/to/PL.txt to seed from a local file instead of downloading."
  task seed: :environment do
    io = ENV["FILE"].present? ? File.open(ENV["FILE"], "r:UTF-8") : nil
    result = Meetups::CitiesSeeder.call(io: io)
    puts "Cities seed finished: imported=#{result.imported} skipped=#{result.skipped}"
  ensure
    io&.close
  end
end
