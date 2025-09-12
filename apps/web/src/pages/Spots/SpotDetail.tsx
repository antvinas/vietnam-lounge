
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getSpotById, fetchReviewsBySpotId, addReview, toggleFavoriteStatus, getRecommendations, Spot, Review } from '../../api/spots.api';
import { FaMapMarkerAlt, FaStar, FaRegStar, FaHeart, FaRegHeart, FaArrowLeft } from 'react-icons/fa';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useAuthStore } from '../../store/auth.store';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const SpotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isFavorited, setIsFavorited] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  });

  const { data: spot, isLoading, isError } = useQuery<Spot | null>(
    ['spot', id], 
    () => id ? getSpotById(id) : Promise.resolve(null),
    {
      onSuccess: (data) => {
        if (data) {
          setIsFavorited(data.isFavorited || false);
        }
      }
    }
  );

  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>(
    ['reviews', id],
    () => id ? fetchReviewsBySpotId(id) : Promise.resolve([]),
    { enabled: !!id }
  );
  
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<Spot[]>(
    ['recommendations', id],
    () => id ? getRecommendations(id) : Promise.resolve([]),
    { enabled: !!id }
  );

  const toggleFavoriteMutation = useMutation(
    (spotId: string) => toggleFavoriteStatus(spotId, !isFavorited),
    {
      onSuccess: (updatedSpot) => {
        setIsFavorited(updatedSpot.isFavorited || false);
        queryClient.setQueryData(['spot', id], updatedSpot);
      }
    }
  );

  const addReviewMutation = useMutation(
    ({ spotId, rating, comment, author }: { spotId: string, rating: number, comment: string, author: string }) => addReview(spotId, rating, comment, author),
    {
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', id]);
            setNewReview({ rating: 0, comment: '' });
        }
    }
  );

  const handleFavoriteClick = () => {
    if (id) toggleFavoriteMutation.mutate(id);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id && newReview.comment && newReview.rating > 0 && user) {
        addReviewMutation.mutate({ spotId: id, ...newReview, author: user.username });
    }
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);


  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="loader"></div></div>;
  if (isError || !spot) return <div className="text-center py-10 text-red-500">Spot not found.</div>;

  const mapCenter = { lat: spot.latitude, lng: spot.longitude };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="relative">
        <img src={spot.imageUrls[0]} alt={spot.name} className="w-full h-96 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-5xl font-extrabold text-white shadow-lg">{spot.name}</h1>
          <p className="text-xl text-gray-200 mt-2 flex items-center"><FaMapMarkerAlt className="mr-2"/> {spot.address}</p>
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 btn btn-circle btn-ghost bg-white/20 hover:bg-white/40">
          <FaArrowLeft className="h-6 w-6 text-white" />
        </button>
        {user && (
            <button onClick={handleFavoriteClick} className="absolute top-8 right-8 btn btn-circle btn-ghost bg-white/20 hover:bg-white/40">
                {isFavorited ? <FaHeart className="h-6 w-6 text-red-500" /> : <FaRegHeart className="h-6 w-6 text-white" />}
            </button>
        )}
      </header>

      <main className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <section>
            <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">About this place</h2>
            <p className="text-lg leading-relaxed mb-6">{spot.description}</p>
            <div className="grid grid-cols-2 gap-4 text-md">
                <p><strong>Category:</strong> {spot.category}</p>
                <p><strong>Region:</strong> {spot.region}</p>
                <p><strong>Operating Hours:</strong> {spot.operatingHours}</p>
                <p><strong>Rating:</strong> {spot.rating.toFixed(1)}/5.0</p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Photo Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {spot.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`${spot.name} gallery image ${index + 1}`} className="rounded-lg shadow-md object-cover h-48 w-full"/>
              ))}
            </div>
          </section>
          
          <section className="mt-12">
            <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Location on Map</h2>
            {isLoaded ? (
              <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={15}>
                <Marker position={mapCenter} />
              </GoogleMap>
            ) : loadError ? (
                <p>Map cannot be loaded at this time.</p>
            ) : (
                <p>Loading map...</p>
            )}
          </section>
        </div>

        <aside>
          <section>
            <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Reviews</h2>
            {user && (
                 <form onSubmit={handleReviewSubmit} className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Leave a Review</h3>
                    <div className="flex items-center mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button type="button" key={star} onClick={() => setNewReview({ ...newReview, rating: star })}>
                                {newReview.rating >= star ? <FaStar className="text-yellow-400"/> : <FaRegStar className="text-gray-400"/>}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="Share your experience..."
                        className="textarea textarea-bordered w-full h-24"
                        required
                    ></textarea>
                    <button type="submit" className="btn btn-primary mt-4 w-full" disabled={addReviewMutation.isLoading}>
                        Submit Review
                    </button>
                </form>
            )}
           
            <div className="space-y-6">
              {isLoadingReviews ? (
                <p>Loading reviews...</p>
              ) : reviews && reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                        <strong className="mr-2">{review.author}</strong>
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => i < review.rating ? <FaStar key={i}/> : <FaRegStar key={i}/>)}
                        </div>
                    </div>
                    <p>{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(review.timestamp).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p>No reviews yet.</p>
              )}
            </div>
          </section>
        </aside>
      </main>

      <section className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-center">You Might Also Like</h2>
              {isLoadingRecommendations ? (
                  <p className="text-center">Loading recommendations...</p>
              ) : recommendations && recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                      {recommendations.map(rec => (
                          <Link to={`/spots/${rec.id}`} key={rec.id} className="card card-compact bg-base-100 shadow-xl hover:scale-105 transition-transform">
                              <figure><img src={rec.imageUrls[0]} alt={rec.name} className="h-48 w-full object-cover" /></figure>
                              <div className="card-body">
                                  <h3 className="card-title text-lg">{rec.name}</h3>
                                  <p>{rec.category}</p>
                              </div>
                          </Link>
                      ))}
                  </div>
              ) : (
                  <p className="text-center">No recommendations available.</p>
              )}
          </div>
      </section>
    </div>
  );
};

export default SpotDetail;
