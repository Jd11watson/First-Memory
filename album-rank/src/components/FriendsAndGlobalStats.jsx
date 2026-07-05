import { friendById, initials } from '../lib/mockFriends'

export default function FriendsAndGlobalStats({ social }) {
  const { friends, global } = social
  const friendsAvg = friends.length
    ? Math.round((friends.reduce((sum, f) => sum + f.score, 0) / friends.length) * 10) / 10
    : null

  return (
    <div className="stats-card">
      <div className="stats-row">
        <div>
          <div className="stats-label">Friends' Average</div>
          {friendsAvg !== null ? (
            <div className="stats-value">{friendsAvg.toFixed(1)}<span className="score-scale">/10</span></div>
          ) : (
            <div className="stats-value" style={{ fontSize: 14, color: 'var(--text-muted)' }}>No friends have rated this yet</div>
          )}
        </div>
        {friends.length > 0 && (
          <div className="friend-avatars">
            {friends.map(f => {
              const friend = friendById(f.friendId)
              return (
                <div key={f.friendId} className={`avatar ${friend.colorClass}`} title={friend.name}>
                  {initials(friend.name)}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {friends.length > 0 && (
        <div className="friend-score-list">
          {friends.map(f => {
            const friend = friendById(f.friendId)
            return (
              <div key={f.friendId} className="friend-score-row">
                <div className={`avatar ${friend.colorClass}`} style={{ marginLeft: 0, width: 20, height: 20, fontSize: 10 }}>
                  {initials(friend.name)}
                </div>
                <div className="friend-score-name">{friend.name}</div>
                <div className="friend-score-value">{f.score.toFixed(1)}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="stats-row">
        <div>
          <div className="stats-label">Global Average</div>
          <div className="stats-value">{global.avg.toFixed(1)}<span className="score-scale">/10</span></div>
          <div className="stats-count">{global.count.toLocaleString()} ratings</div>
        </div>
      </div>
    </div>
  )
}
