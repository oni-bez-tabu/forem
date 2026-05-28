module Api
  module V1
    module Matching
      # CRUD na user's matching profile. Multipart form-data dla photo
      # upload (zarówno web Preact jak i mobile native muszą podać photo
      # jako multipart). Pozostałe endpointy działają z JSON.
      class ProfilesController < ApiController
        before_action :authenticate!

        def show
          profile = MatchingProfile.find_by(user_id: @user.id)
          return render json: { profile: nil } if profile.nil?

          render json: { profile: serialize(profile) }
        end

        def create
          return error_unprocessable_entity("profile_exists") if MatchingProfile.exists?(user_id: @user.id)
          return error_unprocessable_entity("suspended") if @user.suspended?

          profile = MatchingProfile.new(profile_params.merge(user: @user))
          if profile.save
            render json: { ok: true, profile: serialize(profile) }, status: :created
          else
            error_unprocessable_entity(profile.errors.full_messages.to_sentence)
          end
        end

        def update
          profile = MatchingProfile.find_by(user_id: @user.id)
          return error_not_found if profile.nil?

          if profile.update(profile_params)
            render json: { ok: true, profile: serialize(profile) }
          else
            error_unprocessable_entity(profile.errors.full_messages.to_sentence)
          end
        end

        def destroy
          profile = MatchingProfile.find_by(user_id: @user.id)
          return error_not_found if profile.nil?

          profile.destroy
          render json: { ok: true }
        end

        def deactivate
          profile = MatchingProfile.find_by(user_id: @user.id)
          return error_not_found if profile.nil?

          profile.deactivate!
          render json: { ok: true, profile: serialize(profile) }
        end

        def reactivate
          profile = MatchingProfile.find_by(user_id: @user.id)
          return error_not_found if profile.nil?

          profile.reactivate!
          render json: { ok: true, profile: serialize(profile) }
        end

        private

        def profile_params
          params
            .require(:profile)
            .permit(:photo, :identity_type, :city_id, :bio)
        end

        def serialize(profile)
          {
            id: profile.id,
            photo_url: profile.photo&.url,
            identity_type: profile.identity_type,
            bio: profile.bio,
            moderation_state: profile.moderation_state,
            moderation_reason: profile.moderation_reason,
            is_active: profile.is_active?,
            visible_to_others: profile.visible_to_others?,
            city: profile.city && {
              id: profile.city.id,
              name: profile.city.name,
              slug: profile.city.slug,
              is_special: profile.city.is_special?,
            },
          }
        end
      end
    end
  end
end
