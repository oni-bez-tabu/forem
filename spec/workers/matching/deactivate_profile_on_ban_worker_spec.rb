require "rails_helper"

RSpec.describe Matching::DeactivateProfileOnBanWorker do
  it "deactivates an active profile when its user is suspended" do
    profile = create(:matching_profile, :approved)
    profile.user.add_role(:suspended)
    # Hook auto-enqueues the worker; run it inline.
    described_class.new.perform(profile.user_id)
    expect(profile.reload.is_active).to be(false)
  end

  it "noops when the user is not suspended" do
    profile = create(:matching_profile, :approved)
    described_class.new.perform(profile.user_id)
    expect(profile.reload.is_active).to be(true)
  end

  it "noops when there is no profile" do
    user = create(:user)
    user.add_role(:suspended)
    expect { described_class.new.perform(user.id) }.not_to raise_error
  end
end

RSpec.describe "User suspension → matching profile deactivation hook", type: :model do
  it "enqueues the worker when the user is suspended" do
    profile = create(:matching_profile, :approved)
    expect {
      profile.user.add_role(:suspended)
    }.to change(Matching::DeactivateProfileOnBanWorker.jobs, :size).by(1)
    expect(Matching::DeactivateProfileOnBanWorker.jobs.last["args"]).to eq([profile.user_id])
  end
end
