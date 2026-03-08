'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AlbumSettings({ album, memories }: { album: any, memories: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    await fetch('/api/albums/update', {
      method: 'POST',
      body: JSON.stringify({ albumId: album.id, title, description }),
    });
    setLoading(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This wipes all photos from storage too.")) return;
    const check = prompt("Type 'DELETE' to confirm:");
    if (check !== 'DELETE') return;

    setLoading(true);
    const res = await fetch('/api/albums/delete', {
      method: 'POST',
      body: JSON.stringify({ albumId: album.id, memories }),
    });
    if (res.ok) router.push('/');
  };

  return (
    <div className="flex gap-4 items-center">
      {isEditing ? (
        <div className="flex gap-2 bg-white p-2 rounded-xl shadow-xl border border-gray-100 absolute top-20 right-10 z-50">
          <input value={title} onChange={e => setTitle(e.target.value)} className="border p-2 rounded" />
          <button onClick={handleUpdate} className="bg-black text-white px-4 py-2 rounded">Save</button>
          <button onClick={() => setIsEditing(false)} className="text-gray-400">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setIsEditing(true)} className="text-[10px] font-black tracking-widest text-gray-400 hover:text-black uppercase">Edit Archive</button>
      )}
      <button onClick={handleDelete} className="text-[10px] font-black tracking-widest text-red-300 hover:text-red-600 uppercase">Delete</button>
    </div>
  );
}